import type { FastifyInstance } from 'fastify';
import { sendAppointmentReminderEmail } from '../../integrations/email.js';

type Reminder = { id:string; patientId:string; name:string; email:string; date:string; time:string; type:string; template:string|null };

export async function cronRoutes(app: FastifyInstance) {
  app.get('/appointment-reminders', async (request, reply) => {
    if (!app.env.CRON_SECRET) return reply.code(503).send({ error:'Rotina automática não configurada.' });
    if (request.headers.authorization !== `Bearer ${app.env.CRON_SECRET}`) return reply.code(401).send({ error:'Não autorizado.' });
    const result=await app.db.query<Reminder>(`SELECT a.id,a.patient_id AS "patientId",p.name,p.email,
      to_char(a.appointment_date,'YYYY-MM-DD') AS date,to_char(a.appointment_time,'HH24:MI') AS time,
      a.appointment_type AS type,s.reminder_message AS template
      FROM appointments a JOIN patients p ON p.id=a.patient_id CROSS JOIN clinic_settings s
      WHERE a.appointment_date=(now() AT TIME ZONE 'America/Sao_Paulo')::date+1
        AND a.status IN('CONFIRMED','WAITING') AND p.active=true AND p.email IS NOT NULL
        AND NOT EXISTS(SELECT 1 FROM appointment_email_events e WHERE e.appointment_id=a.id AND e.event_type='REMINDER_24H')
      ORDER BY a.appointment_time`);
    let sent=0,failed=0;
    for(const item of result.rows){try{const delivered=await sendAppointmentReminderEmail(app.env,app.db,{to:item.email,name:item.name,date:item.date,time:item.time,type:item.type,template:item.template});if(!delivered){failed++;continue}await app.db.query(`INSERT INTO appointment_email_events(appointment_id,event_type,recipient) VALUES($1,'REMINDER_24H',$2) ON CONFLICT DO NOTHING`,[item.id,item.email]);await app.db.query(`INSERT INTO patient_notifications(patient_id,title,body,kind) VALUES($1,'Lembrete de consulta',$2,'APPOINTMENT')`,[item.patientId,`Sua consulta é amanhã, ${item.date.split('-').reverse().join('/')} às ${item.time}.`]);sent++}catch(error){failed++;app.log.error({err:error,appointmentId:item.id},'Falha no lembrete automático')}}
    return {data:{scheduled:result.rowCount??result.rows.length,sent,failed}};
  });
}
