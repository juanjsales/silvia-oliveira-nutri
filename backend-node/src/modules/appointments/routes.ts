import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { audit } from '../../shared/audit.js';
import { cancelAppointmentCharge, ensureAppointmentCharge, syncOpenAppointmentCharge } from '../../shared/finance.js';
import { canTransitionAppointment, type AppointmentStatus } from '../../shared/appointment-status.js';
import { appointmentEmailKey, enqueueAppointmentEmail, processAppointmentEmail } from '../../shared/appointment-email-outbox.js';

const statusSchema = z.enum(['CONFIRMED', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']);
const appointmentSchema = z.object({
  patientId: z.uuid(), date: z.iso.date(), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  durationMinutes: z.number().int().min(15).max(480).default(60), type: z.string().trim().min(2).max(100),
  price: z.number().nonnegative().max(99999999).optional(), status: statusSchema.default('CONFIRMED'),
  notes: z.string().trim().max(1000).optional(), meetingUrl: z.url().max(1000).optional(), requestId: z.uuid().optional()
});

const appointmentSelect = `SELECT a.id, a.patient_id AS "patientId", p.name AS "patientName", p.whatsapp,
  a.appointment_date AS date, to_char(a.appointment_time, 'HH24:MI') AS time,
  a.duration_minutes AS "durationMinutes", a.appointment_type AS type, a.price::float8 AS price,
  a.patient_response AS "patientResponse", a.patient_response_note AS "patientResponseNote",
  a.status, a.notes, a.meeting_url AS "meetingUrl", a.created_at AS "createdAt",
  e.id AS "encounterId", e.status AS "encounterStatus"
  FROM appointments a JOIN patients p ON p.id = a.patient_id
  LEFT JOIN clinical_encounters e ON e.appointment_id=a.id`;

export async function appointmentRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAdmin);

  app.get('/', async request => {
    const query = z.object({
      from: z.iso.date().optional(),
      to: z.iso.date().optional(),
      date: z.iso.date().optional(),
    }).parse(request.query);
    const from = query.from || query.date || new Date().toISOString().slice(0, 10);
    const to = query.to || query.date || from;
    const result = await app.db.query(`${appointmentSelect} WHERE a.appointment_date BETWEEN $1 AND $2 ORDER BY a.appointment_date, a.appointment_time`, [from, to]);
    return { data: result.rows };
  });

  app.get('/requests', async () => {
    const result = await app.db.query(`SELECT r.id,r.patient_id AS "patientId",p.name AS "patientName",to_char(r.preferred_date,'YYYY-MM-DD') AS "preferredDate",r.preferred_period AS "preferredPeriod",r.appointment_type AS "appointmentType",r.notes,r.status,r.created_at AS "createdAt" FROM appointment_requests r JOIN patients p ON p.id=r.patient_id WHERE r.status='PENDING' ORDER BY r.preferred_date,r.created_at`);
    return { data: result.rows };
  });

  app.post('/', async (request, reply) => {
    const body = appointmentSchema.parse(request.body);
    if (!['CONFIRMED', 'WAITING'].includes(body.status)) return reply.code(400).send({ error: 'Uma nova consulta deve iniciar como confirmada ou aguardando.' });
    const patient = await app.db.query<{id:string;name:string;email:string|null}>('SELECT id,name,email FROM patients WHERE id=$1 AND active=true', [body.patientId]);
    if (!patient.rows[0]) return reply.code(404).send({ error: 'Paciente não encontrado ou inativo.' });

    const client = await app.db.connect();
    let id: string;
    let deliveryId: string | null = null;
    try {
      await client.query('BEGIN');
      if (body.requestId) {
        const requestResult = await client.query<{patient_id:string}>(`SELECT patient_id FROM appointment_requests WHERE id=$1 AND status='PENDING' FOR UPDATE`, [body.requestId]);
        if (!requestResult.rows[0] || requestResult.rows[0].patient_id !== body.patientId) {
          await client.query('ROLLBACK');
          return reply.code(409).send({ error: 'Solicitação não encontrada, já processada ou vinculada a outro paciente.' });
        }
      }
      const result = await client.query<{id:string}>(`INSERT INTO appointments
        (patient_id,appointment_date,appointment_time,duration_minutes,appointment_type,price,status,notes,meeting_url)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [body.patientId,body.date,body.time,body.durationMinutes,body.type,body.price??null,body.status,body.notes||null,body.meetingUrl||null]);
      id = result.rows[0]!.id;
      if (body.requestId) await client.query(`UPDATE appointment_requests SET status='APPROVED' WHERE id=$1`, [body.requestId]);
      await client.query(`INSERT INTO patient_notifications(patient_id,title,body,kind) VALUES($1,'Consulta agendada',$2,'APPOINTMENT')`, [body.patientId, `Sua consulta foi confirmada para ${body.date.split('-').reverse().join('/')} às ${body.time}.`]);
      if (patient.rows[0].email) {
        const queued = await enqueueAppointmentEmail(client, {
          appointmentId: id, eventType: 'SCHEDULED', recipient: patient.rows[0].email,
          payload: { name: patient.rows[0].name, date: body.date, time: body.time, type: body.type, durationMinutes: body.durationMinutes },
          deduplicationKey: appointmentEmailKey(id, 'SCHEDULED', 'created')
        });
        deliveryId = queued.id;
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const delivery = deliveryId ? await processAppointmentEmail(app, deliveryId) : null;
    const emailSent = delivery?.sent ?? false;
    await audit(app.db, 'APPOINTMENT_CREATED', 'appointment', { actorUserId: request.auth!.userId, entityId: id, metadata: { patientId: body.patientId, emailSent, emailDeliveryId: deliveryId } });
    return reply.code(201).send({ data: { id, emailSent, emailDeliveryId: deliveryId, warning: emailSent ? null : patient.rows[0].email ? 'Consulta criada; o e-mail ficou registrado para nova tentativa automática.' : 'Consulta criada, mas o paciente não possui e-mail cadastrado.' } });
  });

  app.patch('/requests/:id', async (request, reply) => {
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    const { status } = z.object({ status: z.literal('DECLINED') }).parse(request.body);
    const result = await app.db.query<{patient_id:string}>(`UPDATE appointment_requests SET status=$1 WHERE id=$2 AND status='PENDING' RETURNING patient_id`, [status,id]);
    if (!result.rows[0]) return reply.code(404).send({ error: 'Solicitação pendente não encontrada.' });
    await app.db.query(`INSERT INTO patient_notifications(patient_id,title,body,kind) VALUES($1,'Solicitação de consulta atualizada','Entre em contato com o consultório para escolhermos uma nova data.','APPOINTMENT')`, [result.rows[0].patient_id]);
    return { data: { id } };
  });

  app.patch('/:id', async (request, reply) => {
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    const body = appointmentSchema.partial().parse(request.body);
    const current = await app.db.query<Record<string, unknown>>('SELECT * FROM appointments WHERE id=$1', [id]);
    if (!current.rows[0]) return reply.code(404).send({ error: 'Agendamento não encontrado.' });
    const a = current.rows[0];
    let financeCreated = false;
    const scheduleChanged = body.date !== undefined || body.time !== undefined || body.durationMinutes !== undefined;
    const currentStatus = a.status as AppointmentStatus;
    const nextStatus = (body.status ?? currentStatus) as AppointmentStatus;
    if (!canTransitionAppointment(currentStatus,nextStatus,scheduleChanged)) return reply.code(409).send({ error: 'Alteração de status incompatível com o estado atual da consulta.' });
    if ((nextStatus === 'COMPLETED' || nextStatus === 'CANCELLED') && nextStatus !== currentStatus) {
      const encounter = await app.db.query<{status:string}>('SELECT status FROM clinical_encounters WHERE appointment_id=$1', [id]);
      if (encounter.rows[0]?.status === 'IN_PROGRESS') return reply.code(409).send({ error: 'Existe um atendimento em andamento. Finalize-o pela sala de atendimento antes de alterar a consulta.' });
    }

    const client = await app.db.connect();
    let deliveryId: string | null = null;
    try {
      await client.query('BEGIN');
      const updated = await client.query<{revision:Date}>(`UPDATE appointments SET patient_id=$1,appointment_date=$2,appointment_time=$3,
        duration_minutes=$4,appointment_type=$5,price=$6,status=$7,notes=$8,meeting_url=$9,
        patient_response=CASE WHEN $11 THEN 'PENDING' ELSE patient_response END,
        patient_response_at=CASE WHEN $11 THEN NULL ELSE patient_response_at END,
        patient_response_note=CASE WHEN $11 THEN NULL ELSE patient_response_note END,updated_at=now()
        WHERE id=$10 RETURNING updated_at AS revision`,
        [body.patientId??a.patient_id,body.date??a.appointment_date,body.time??a.appointment_time,
         body.durationMinutes??a.duration_minutes,body.type??a.appointment_type,body.price??a.price,
         body.status??a.status,body.notes??a.notes,body.meetingUrl??a.meeting_url,id,scheduleChanged]);
      if (scheduleChanged || body.status === 'CANCELLED') {
        await client.query(`INSERT INTO patient_notifications(patient_id,title,body,kind) SELECT patient_id,CASE WHEN status='CANCELLED' THEN 'Consulta cancelada' ELSE 'Novo horário da consulta' END,CASE WHEN status='CANCELLED' THEN 'Sua consulta foi cancelada pelo consultório.' ELSE 'Sua consulta foi atualizada para '||to_char(appointment_date,'DD/MM/YYYY')||' às '||to_char(appointment_time,'HH24:MI')||'. Confirme o novo horário no portal.' END,'APPOINTMENT' FROM appointments WHERE id=$1`, [id]);
        const target = (await client.query<{email:string|null;name:string;date:string;time:string;type:string}>(`SELECT p.email,p.name,to_char(a.appointment_date,'YYYY-MM-DD') AS date,to_char(a.appointment_time,'HH24:MI') AS time,a.appointment_type AS type FROM appointments a JOIN patients p ON p.id=a.patient_id WHERE a.id=$1`, [id])).rows[0];
        if (target?.email) {
          const eventType = body.status === 'CANCELLED' ? 'CANCELLED' : 'RESCHEDULED';
          const queued = await enqueueAppointmentEmail(client, {
            appointmentId: id, eventType, recipient: target.email,
            payload: { name: target.name, date: target.date, time: target.time, type: target.type },
            deduplicationKey: appointmentEmailKey(id,eventType,updated.rows[0]!.revision.toISOString())
          });
          deliveryId = queued.id;
        }
      }
      if (body.status === 'COMPLETED') {
        const finance = await ensureAppointmentCharge(client,id,request.auth!.userId);
        financeCreated = finance.created;
      } else if (body.status === 'CANCELLED') {
        await cancelAppointmentCharge(client,id);
      } else if (scheduleChanged || body.price !== undefined || body.type !== undefined || body.patientId !== undefined) {
        await syncOpenAppointmentCharge(client,id);
      }
      await audit(client,'APPOINTMENT_UPDATED','appointment',{ actorUserId:request.auth!.userId,entityId:id,metadata:{fields:Object.keys(body),financeCreated,scheduleChanged,emailDeliveryId:deliveryId} });
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const shouldEmail = scheduleChanged || body.status === 'CANCELLED';
    const delivery = deliveryId ? await processAppointmentEmail(app,deliveryId) : null;
    const emailSent = shouldEmail ? delivery?.sent ?? false : null;
    const warning = !shouldEmail || emailSent ? null : deliveryId ? 'Consulta atualizada; o e-mail ficou registrado para nova tentativa automática.' : 'Consulta atualizada, mas o paciente não possui e-mail cadastrado.';
    return { data: { id, financeCreated, emailSent, emailDeliveryId: deliveryId, warning } };
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    const linked = await app.db.query<{status:string}>(`SELECT status FROM clinical_encounters WHERE appointment_id=$1`,[id]);
    if(linked.rows[0]) return reply.code(409).send({error:'Este agendamento possui prontuário vinculado e não pode ser descartado. Cancele ou finalize o atendimento correspondente.'});
    const removed = await app.db.query<{patient_id:string}>(`DELETE FROM appointments WHERE id=$1 AND status IN ('CONFIRMED','WAITING','CANCELLED','NO_SHOW') RETURNING patient_id`,[id]);
    if(!removed.rows[0]) return reply.code(409).send({error:'Agendamento em andamento ou concluído não pode ser descartado.'});
    await audit(app.db,'APPOINTMENT_DISCARDED','appointment',{actorUserId:request.auth!.userId,entityId:id,metadata:{patientId:removed.rows[0].patient_id}});
    return reply.code(204).send();
  });
}
