import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { audit } from '../../shared/audit.js';
import { sendAppointmentEmail } from '../../integrations/email.js';

const statusSchema = z.enum(['CONFIRMED', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']);
const appointmentSchema = z.object({
  patientId: z.uuid(), date: z.iso.date(), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  durationMinutes: z.number().int().min(15).max(480).default(60), type: z.string().trim().min(2).max(100),
  price: z.number().nonnegative().max(99999999).optional(), status: statusSchema.default('CONFIRMED'),
  notes: z.string().trim().max(1000).optional(), meetingUrl: z.url().max(1000).optional()
});

const appointmentSelect = `SELECT a.id, a.patient_id AS "patientId", p.name AS "patientName", p.whatsapp,
  a.appointment_date AS date, to_char(a.appointment_time, 'HH24:MI') AS time,
  a.duration_minutes AS "durationMinutes", a.appointment_type AS type, a.price::float8 AS price,
  a.status, a.notes, a.meeting_url AS "meetingUrl", a.created_at AS "createdAt"
  FROM appointments a JOIN patients p ON p.id = a.patient_id`;

export async function appointmentRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAdmin);

  app.get('/', async request => {
    const query = z.object({ from: z.iso.date(), to: z.iso.date() }).parse(request.query);
    const result = await app.db.query(`${appointmentSelect} WHERE a.appointment_date BETWEEN $1 AND $2 ORDER BY a.appointment_date, a.appointment_time`, [query.from, query.to]);
    return { data: result.rows };
  });

  app.post('/', async (request, reply) => {
    const body = appointmentSchema.parse(request.body);
    const patient = await app.db.query<{id:string;name:string;email:string|null}>('SELECT id,name,email FROM patients WHERE id=$1 AND active=true', [body.patientId]);
    if (!patient.rows[0]) return reply.code(404).send({ error: 'Paciente não encontrado ou inativo.' });
    const result = await app.db.query<{ id: string }>(`INSERT INTO appointments
      (patient_id, appointment_date, appointment_time, duration_minutes, appointment_type, price, status, notes, meeting_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [body.patientId, body.date, body.time, body.durationMinutes, body.type, body.price ?? null, body.status, body.notes || null, body.meetingUrl || null]);
    const id = result.rows[0]!.id;
    let emailSent=false;const recipient=patient.rows[0]!.email;if(recipient)try{emailSent=await sendAppointmentEmail(app.env,{to:recipient,name:patient.rows[0]!.name,date:body.date,time:body.time,type:body.type,durationMinutes:body.durationMinutes})}catch(error){app.log.error({err:error,appointmentId:id},'Falha ao enviar confirmação de consulta')}
    await audit(app.db, 'APPOINTMENT_CREATED', 'appointment', { actorUserId: request.auth!.userId, entityId: id, metadata: { patientId: body.patientId,emailSent } });
    return reply.code(201).send({ data: { id,emailSent,warning:emailSent?null:recipient?'Consulta criada, mas o e-mail não foi enviado. Verifique o SMTP.':'Consulta criada, mas o paciente não possui e-mail cadastrado.' } });
  });

  app.patch('/:id', async (request, reply) => {
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    const body = appointmentSchema.partial().parse(request.body);
    const current = await app.db.query<Record<string, unknown>>('SELECT * FROM appointments WHERE id=$1', [id]);
    if (!current.rows[0]) return reply.code(404).send({ error: 'Agendamento não encontrado.' });
    const a = current.rows[0];
    await app.db.query(`UPDATE appointments SET patient_id=$1, appointment_date=$2, appointment_time=$3,
      duration_minutes=$4, appointment_type=$5, price=$6, status=$7, notes=$8, meeting_url=$9, updated_at=now() WHERE id=$10`,
      [body.patientId ?? a.patient_id, body.date ?? a.appointment_date, body.time ?? a.appointment_time,
       body.durationMinutes ?? a.duration_minutes, body.type ?? a.appointment_type, body.price ?? a.price,
       body.status ?? a.status, body.notes ?? a.notes, body.meetingUrl ?? a.meeting_url, id]);
    await audit(app.db, 'APPOINTMENT_UPDATED', 'appointment', { actorUserId: request.auth!.userId, entityId: id, metadata: { fields: Object.keys(body) } });
    return { data: { id } };
  });
}
