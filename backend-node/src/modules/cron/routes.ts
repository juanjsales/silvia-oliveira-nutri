import type { FastifyInstance } from 'fastify';
import { appointmentEmailKey, enqueueAppointmentEmail, processPendingAppointmentEmails } from '../../shared/appointment-email-outbox.js';

type Reminder = { id:string; name:string; email:string; date:string; time:string; type:string; template:string|null };

export async function cronRoutes(app: FastifyInstance) {
  app.get('/appointment-reminders', async (request, reply) => {
    if (!app.env.CRON_SECRET) return reply.code(503).send({ error:'Rotina automática não configurada.' });
    if (request.headers.authorization !== `Bearer ${app.env.CRON_SECRET}`) return reply.code(401).send({ error:'Não autorizado.' });

    const result = await app.db.query<Reminder>(`SELECT a.id,p.name,p.email,
      to_char(a.appointment_date,'YYYY-MM-DD') AS date,to_char(a.appointment_time,'HH24:MI') AS time,
      a.appointment_type AS type,s.reminder_message AS template
      FROM appointments a JOIN patients p ON p.id=a.patient_id CROSS JOIN clinic_settings s
      WHERE a.appointment_date=(now() AT TIME ZONE 'America/Sao_Paulo')::date+1
        AND a.status IN('CONFIRMED','WAITING') AND p.active=true AND p.email IS NOT NULL
        AND NOT EXISTS(SELECT 1 FROM appointment_email_outbox o WHERE o.appointment_id=a.id AND o.event_type='REMINDER_24H')
      ORDER BY a.appointment_time`);

    for (const item of result.rows) {
      await enqueueAppointmentEmail(app.db, {
        appointmentId:item.id,eventType:'REMINDER_24H',recipient:item.email,
        payload:{name:item.name,date:item.date,time:item.time,type:item.type,template:item.template},
        deduplicationKey:appointmentEmailKey(item.id,'REMINDER_24H',item.date)
      });
    }
    const delivery = await processPendingAppointmentEmails(app);
    return { data: delivery };
  });
}
