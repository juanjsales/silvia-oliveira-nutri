import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { audit } from '../../shared/audit.js';

export async function portalRoutes(app:FastifyInstance){
 app.addHook('preHandler',app.authenticate);
 app.addHook('preHandler',async(request,reply)=>{if(request.auth?.role!=='PATIENT'||!request.auth.patientId)return reply.code(403).send({error:'Acesso restrito ao paciente.'})});
 app.get('/home',async request=>{const patientId=request.auth!.patientId!;
  const patient=await app.db.query(`SELECT id,name,email,whatsapp,birth_date AS "birthDate",objective FROM patients WHERE id=$1 AND active=true`,[patientId]);
  const appointments=await app.db.query(`SELECT id,appointment_date AS "appointmentDate",appointment_time AS "appointmentTime",duration_minutes AS "durationMinutes",appointment_type AS "appointmentType",status,CASE WHEN status IN ('CONFIRMED','WAITING','IN_PROGRESS') THEN '/portal/video/'||id::text END AS "meetingUrl",NULL::text AS "videoRoomToken" FROM appointments WHERE patient_id=$1 ORDER BY appointment_date DESC,appointment_time DESC LIMIT 30`,[patientId]);
  const plans=await app.db.query(`SELECT id,title,objective,status,content,published_at AS "publishedAt",updated_at AS "updatedAt" FROM meal_plans WHERE patient_id=$1 AND status='PUBLISHED' ORDER BY published_at DESC NULLS LAST,updated_at DESC`,[patientId]);
  const settings=await app.db.query(`SELECT clinic_name AS "clinicName",professional_name AS "professionalName",crn,specialty,phone,email,logo_url AS "logoUrl",primary_color AS "primaryColor",secondary_color AS "secondaryColor",document_footer AS "documentFooter" FROM clinic_settings WHERE singleton=true`);
  const documents=await app.db.query(`SELECT id,document_number AS "documentNumber",type,title,issued_at AS "issuedAt" FROM clinical_documents WHERE patient_id=$1 AND status='ISSUED' AND available_to_patient=true ORDER BY issued_at DESC`,[patientId]);
  await audit(app.db,'PATIENT_PORTAL_VIEWED','patient',{actorUserId:request.auth!.userId,entityId:patientId});
  return{data:{patient:patient.rows[0],appointments:appointments.rows,plans:plans.rows,documents:documents.rows,settings:settings.rows[0]||null}};
 });
 app.get('/plans/:id',async(request,reply)=>{const{id}=z.object({id:z.uuid()}).parse(request.params);const result=await app.db.query(`SELECT id,title,objective,status,content,published_at AS "publishedAt",updated_at AS "updatedAt" FROM meal_plans WHERE id=$1 AND patient_id=$2 AND status='PUBLISHED'`,[id,request.auth!.patientId]);return result.rows[0]?{data:result.rows[0]}:reply.code(404).send({error:'Plano não encontrado.'})});
 app.get('/documents/:id',async(request,reply)=>{const{id}=z.object({id:z.uuid()}).parse(request.params);const r=await app.db.query(`SELECT d.snapshot,d.document_number AS "documentNumber",d.type,d.title,d.issued_at AS "issuedAt",p.name AS "patientName",s.clinic_name AS "clinicName",s.professional_name AS "professionalName",s.crn,s.specialty,s.phone,s.email,s.logo_url AS "logoUrl",s.primary_color AS "primaryColor",s.secondary_color AS "secondaryColor",s.document_footer AS "documentFooter" FROM clinical_documents d JOIN patients p ON p.id=d.patient_id LEFT JOIN clinic_settings s ON s.singleton=true WHERE d.id=$1 AND d.patient_id=$2 AND d.status='ISSUED' AND d.available_to_patient=true`,[id,request.auth!.patientId]);return r.rows[0]?{data:r.rows[0]}:reply.code(404).send({error:'Documento não encontrado ou não disponibilizado.'})});
}
