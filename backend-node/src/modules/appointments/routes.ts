import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { audit } from '../../shared/audit.js';
import { sendAppointmentEmail } from '../../integrations/email.js';
import { ensureAppointmentCharge } from '../../shared/finance.js';

const statusSchema = z.enum(['CONFIRMED', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']);
const appointmentSchema = z.object({
  patientId: z.uuid(), date: z.iso.date(), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  durationMinutes: z.number().int().min(15).max(480).default(60), type: z.string().trim().min(2).max(100),
  price: z.number().nonnegative().max(99999999).optional(), status: statusSchema.default('CONFIRMED'),
  notes: z.string().trim().max(1000).optional(), meetingUrl: z.url().max(1000).optional(), requestId:z.uuid().optional()
});

const appointmentSelect = `SELECT a.id, a.patient_id AS "patientId", p.name AS "patientName", p.whatsapp,
  a.appointment_date AS date, to_char(a.appointment_time, 'HH24:MI') AS time,
  a.duration_minutes AS "durationMinutes", a.appointment_type AS type, a.price::float8 AS price,
  a.patient_response AS "patientResponse", a.patient_response_note AS "patientResponseNote",
  a.status, a.notes, a.meeting_url AS "meetingUrl", a.created_at AS "createdAt"
  FROM appointments a JOIN patients p ON p.id = a.patient_id`;

export async function appointmentRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAdmin);

  app.get('/', async request => {
    const query = z.object({ from: z.iso.date(), to: z.iso.date() }).parse(request.query);
    const result = await app.db.query(`${appointmentSelect} WHERE a.appointment_date BETWEEN $1 AND $2 ORDER BY a.appointment_date, a.appointment_time`, [query.from, query.to]);
    return { data: result.rows };
  });

  app.get('/requests',async()=>{const result=await app.db.query(`SELECT r.id,r.patient_id AS "patientId",p.name AS "patientName",to_char(r.preferred_date,'YYYY-MM-DD') AS "preferredDate",r.preferred_period AS "preferredPeriod",r.appointment_type AS "appointmentType",r.notes,r.status,r.created_at AS "createdAt" FROM appointment_requests r JOIN patients p ON p.id=r.patient_id WHERE r.status='PENDING' ORDER BY r.preferred_date,r.created_at`);return{data:result.rows}});

  app.post('/', async (request, reply) => {
    const body = appointmentSchema.parse(request.body);
    const patient = await app.db.query<{id:string;name:string;email:string|null}>('SELECT id,name,email FROM patients WHERE id=$1 AND active=true', [body.patientId]);
    if (!patient.rows[0]) return reply.code(404).send({ error: 'Paciente não encontrado ou inativo.' });
    const client=await app.db.connect();let id:string;try{await client.query('BEGIN');if(body.requestId){const requestResult=await client.query<{patient_id:string}>(`SELECT patient_id FROM appointment_requests WHERE id=$1 AND status='PENDING' FOR UPDATE`,[body.requestId]);if(!requestResult.rows[0]||requestResult.rows[0].patient_id!==body.patientId){await client.query('ROLLBACK');return reply.code(409).send({error:'Solicitação não encontrada, já processada ou vinculada a outro paciente.'})}}
    const result = await client.query<{ id: string }>(`INSERT INTO appointments
      (patient_id, appointment_date, appointment_time, duration_minutes, appointment_type, price, status, notes, meeting_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [body.patientId, body.date, body.time, body.durationMinutes, body.type, body.price ?? null, body.status, body.notes || null, body.meetingUrl || null]);
    id = result.rows[0]!.id;if(body.requestId)await client.query(`UPDATE appointment_requests SET status='APPROVED' WHERE id=$1`,[body.requestId]);await client.query(`INSERT INTO patient_notifications(patient_id,title,body,kind)VALUES($1,'Consulta agendada',$2,'APPOINTMENT')`,[body.patientId,`Sua consulta foi confirmada para ${body.date.split('-').reverse().join('/')} às ${body.time}.`]);await client.query('COMMIT')}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
    let emailSent=false;const recipient=patient.rows[0]!.email;if(recipient)try{emailSent=await sendAppointmentEmail(app.env,app.db,{to:recipient,name:patient.rows[0]!.name,date:body.date,time:body.time,type:body.type,durationMinutes:body.durationMinutes})}catch(error){app.log.error({err:error,appointmentId:id},'Falha ao enviar confirmação de consulta')}
    await audit(app.db, 'APPOINTMENT_CREATED', 'appointment', { actorUserId: request.auth!.userId, entityId: id, metadata: { patientId: body.patientId,emailSent } });
    return reply.code(201).send({ data: { id,emailSent,warning:emailSent?null:recipient?'Consulta criada, mas o e-mail não foi enviado. Verifique o SMTP.':'Consulta criada, mas o paciente não possui e-mail cadastrado.' } });
  });

  app.patch('/requests/:id',async(request,reply)=>{const{id}=z.object({id:z.uuid()}).parse(request.params);const{status}=z.object({status:z.literal('DECLINED')}).parse(request.body);const result=await app.db.query<{patient_id:string}>(`UPDATE appointment_requests SET status=$1 WHERE id=$2 AND status='PENDING' RETURNING patient_id`,[status,id]);if(!result.rows[0])return reply.code(404).send({error:'Solicitação pendente não encontrada.'});await app.db.query(`INSERT INTO patient_notifications(patient_id,title,body,kind)VALUES($1,'Solicitação de consulta atualizada','Entre em contato com o consultório para escolhermos uma nova data.','APPOINTMENT')`,[result.rows[0].patient_id]);return{data:{id}}});

  app.patch('/:id', async (request, reply) => {
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    const body = appointmentSchema.partial().parse(request.body);
    const current = await app.db.query<Record<string, unknown>>('SELECT * FROM appointments WHERE id=$1', [id]);
    if (!current.rows[0]) return reply.code(404).send({ error: 'Agendamento não encontrado.' });
    const a = current.rows[0];
    let financeCreated = false;
    const scheduleChanged=body.date!==undefined||body.time!==undefined||body.durationMinutes!==undefined;
    const client=await app.db.connect();try{await client.query('BEGIN');await client.query(`UPDATE appointments SET patient_id=$1, appointment_date=$2, appointment_time=$3,
      duration_minutes=$4, appointment_type=$5, price=$6, status=$7, notes=$8, meeting_url=$9,
      patient_response=CASE WHEN $11 THEN 'PENDING' ELSE patient_response END,
      patient_response_at=CASE WHEN $11 THEN NULL ELSE patient_response_at END,
      patient_response_note=CASE WHEN $11 THEN NULL ELSE patient_response_note END, updated_at=now() WHERE id=$10`,
      [body.patientId ?? a.patient_id, body.date ?? a.appointment_date, body.time ?? a.appointment_time,
       body.durationMinutes ?? a.duration_minutes, body.type ?? a.appointment_type, body.price ?? a.price,
       body.status ?? a.status, body.notes ?? a.notes, body.meetingUrl ?? a.meeting_url, id,scheduleChanged]);if(scheduleChanged||body.status==='CANCELLED'){await client.query(`INSERT INTO patient_notifications(patient_id,title,body,kind) SELECT patient_id,CASE WHEN status='CANCELLED' THEN 'Consulta cancelada' ELSE 'Novo horário da consulta' END,CASE WHEN status='CANCELLED' THEN 'Sua consulta foi cancelada pelo consultório.' ELSE 'Sua consulta foi atualizada para '||to_char(appointment_date,'DD/MM/YYYY')||' às '||to_char(appointment_time,'HH24:MI')||'. Confirme o novo horário no portal.' END,'APPOINTMENT' FROM appointments WHERE id=$1`,[id])}if(body.status==='COMPLETED'){const finance=await ensureAppointmentCharge(client,id,request.auth!.userId);financeCreated=finance.created}await audit(client,'APPOINTMENT_UPDATED','appointment',{actorUserId:request.auth!.userId,entityId:id,metadata:{fields:Object.keys(body),financeCreated,scheduleChanged}});await client.query('COMMIT')}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
    return { data: { id, financeCreated } };
  });
}
