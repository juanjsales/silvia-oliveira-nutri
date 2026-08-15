import type{FastifyInstance}from'fastify';
import{z}from'zod';
import{audit}from'../../shared/audit.js';
import{processAppointmentEmail}from'../../shared/appointment-email-outbox.js';

export async function emailDeliveryRoutes(app:FastifyInstance){
  app.addHook('preHandler',app.requireAdmin);
  app.get('/',async request=>{const query=z.object({status:z.enum(['PENDING','PROCESSING','SENT','FAILED']).optional(),appointmentId:z.uuid().optional()}).parse(request.query);const result=await app.db.query(`SELECT o.id,o.appointment_id AS "appointmentId",p.name AS "patientName",o.event_type AS "eventType",o.recipient,o.status,o.attempts,o.max_attempts AS "maxAttempts",o.next_attempt_at AS "nextAttemptAt",o.last_error AS "lastError",o.created_at AS "createdAt",o.attempted_at AS "attemptedAt",o.sent_at AS "sentAt" FROM appointment_email_outbox o JOIN appointments a ON a.id=o.appointment_id JOIN patients p ON p.id=a.patient_id WHERE($1::text IS NULL OR o.status=$1)AND($2::uuid IS NULL OR o.appointment_id=$2)ORDER BY o.created_at DESC LIMIT 200`,[query.status??null,query.appointmentId??null]);return{data:result.rows}});
  app.post('/:id/retry',async(request,reply)=>{const{id}=z.object({id:z.uuid()}).parse(request.params);const reset=await app.db.query(`UPDATE appointment_email_outbox SET status='PENDING',attempts=0,next_attempt_at=now(),processing_started_at=NULL,last_error=NULL WHERE id=$1 AND status='FAILED' RETURNING id`,[id]);if(!reset.rows[0])return reply.code(409).send({error:'Somente uma entrega com falha pode ser reenviada.'});const result=await processAppointmentEmail(app,id);await audit(app.db,'APPOINTMENT_EMAIL_RETRIED','appointment_email_outbox',{actorUserId:request.auth!.userId,entityId:id,metadata:{sent:result.sent}});return{data:{id,...result}}});
}
