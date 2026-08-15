import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { AppEnv } from '../config/env.js';
import type { Database } from '../database/pool.js';
import { sendAppointmentEmail, sendAppointmentReminderEmail, sendAppointmentUpdateEmail } from '../integrations/email.js';

export type AppointmentEmailType='SCHEDULED'|'RESCHEDULED'|'CANCELLED'|'REMINDER_24H';
type Queryable={query:(sql:string,params?:unknown[])=>Promise<{rows:any[];rowCount?:number|null}>};
const payloadSchema=z.object({name:z.string(),date:z.string(),time:z.string(),type:z.string(),durationMinutes:z.number().optional(),template:z.string().nullable().optional()});

export function appointmentEmailKey(appointmentId:string,eventType:AppointmentEmailType,revision:string){
  return createHash('sha256').update(`${appointmentId}:${eventType}:${revision}`).digest('hex');
}

export async function enqueueAppointmentEmail(db:Queryable,input:{appointmentId:string;eventType:AppointmentEmailType;recipient:string;payload:unknown;deduplicationKey:string}){
  const result=await db.query(`INSERT INTO appointment_email_outbox(appointment_id,event_type,recipient,payload,deduplication_key)
    VALUES($1,$2,lower(trim($3)),$4,$5) ON CONFLICT(deduplication_key) DO UPDATE SET
    deduplication_key=excluded.deduplication_key
    RETURNING id,status`,[input.appointmentId,input.eventType,input.recipient,input.payload,input.deduplicationKey]);
  return result.rows[0] as {id:string;status:string};
}

export async function processAppointmentEmail(app:{db:Database;env:AppEnv;log:{error:(details:unknown,message:string)=>void}},id:string){
  const claimed=await app.db.query<any>(`UPDATE appointment_email_outbox SET status='PROCESSING',attempts=attempts+1,attempted_at=now(),processing_started_at=now()
    WHERE id=$1 AND attempts<max_attempts AND next_attempt_at<=now()
      AND (status IN('PENDING','FAILED') OR (status='PROCESSING' AND processing_started_at<now()-interval '15 minutes'))
    RETURNING id,appointment_id AS "appointmentId",event_type AS "eventType",recipient,payload,attempts,max_attempts`,[id]);
  const item=claimed.rows[0];
  if(!item)return{processed:false,sent:false};
  try{
    const payload=payloadSchema.parse(item.payload);
    let sent=false;
    if(item.eventType==='SCHEDULED')sent=await sendAppointmentEmail(app.env,app.db,{...payload,to:item.recipient,durationMinutes:payload.durationMinutes??60});
    else if(item.eventType==='REMINDER_24H')sent=await sendAppointmentReminderEmail(app.env,app.db,{to:item.recipient,name:payload.name,date:payload.date,time:payload.time,type:payload.type,template:payload.template??null});
    else sent=await sendAppointmentUpdateEmail(app.env,app.db,{...payload,to:item.recipient,cancelled:item.eventType==='CANCELLED'});
    if(!sent)throw new Error('SMTP não configurado ou desativado.');
    await app.db.query(`UPDATE appointment_email_outbox SET status='SENT',sent_at=now(),processing_started_at=NULL,last_error=NULL WHERE id=$1`,[id]);
    if(item.eventType==='REMINDER_24H'){
      await app.db.query(`INSERT INTO appointment_email_events(appointment_id,event_type,recipient)
        VALUES($1,'REMINDER_24H',$2) ON CONFLICT DO NOTHING`,[item.appointmentId,item.recipient]);
      await app.db.query(`INSERT INTO patient_notifications(patient_id,title,body,kind)
        SELECT patient_id,'Lembrete de consulta',$2,'APPOINTMENT' FROM appointments WHERE id=$1
        AND NOT EXISTS(SELECT 1 FROM patient_notifications WHERE patient_id=appointments.patient_id AND title='Lembrete de consulta' AND body=$2 AND created_at>now()-interval '2 days')`,
        [item.appointmentId,`Sua consulta é amanhã, ${payload.date.split('-').reverse().join('/')} às ${payload.time}.`]);
    }
    return{processed:true,sent:true};
  }catch(error){
    const message=(error instanceof Error?error.message:'Falha desconhecida').slice(0,1000);
    const exhausted=item.attempts>=item.max_attempts;
    await app.db.query(`UPDATE appointment_email_outbox SET status='FAILED',processing_started_at=NULL,last_error=$2,
      next_attempt_at=CASE WHEN $3 THEN next_attempt_at ELSE now()+(LEAST(60,power(2,attempts))::text||' minutes')::interval END WHERE id=$1`,[id,message,exhausted]);
    app.log.error({err:error,appointmentId:item.appointmentId,emailDeliveryId:id},'Falha ao processar e-mail de consulta');
    return{processed:true,sent:false};
  }
}

export async function processPendingAppointmentEmails(app:{db:Database;env:AppEnv;log:{error:(details:unknown,message:string)=>void}},limit=25){
  const pending=await app.db.query<{id:string}>(`SELECT id FROM appointment_email_outbox
    WHERE (status IN('PENDING','FAILED') OR (status='PROCESSING' AND processing_started_at<now()-interval '15 minutes'))
      AND attempts<max_attempts AND next_attempt_at<=now()
    ORDER BY next_attempt_at,created_at LIMIT $1`,[limit]);
  let sent=0,failed=0;
  for(const row of pending.rows){const result=await processAppointmentEmail(app,row.id);if(result.sent)sent++;else if(result.processed)failed++}
  return{scheduled:pending.rows.length,sent,failed};
}
