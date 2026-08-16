import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { examStorage } from '../../integrations/storage.js';
import { audit } from '../../shared/audit.js';

const params=z.object({id:z.uuid()});

export async function patientExamRoutes(app:FastifyInstance){
  app.addHook('preHandler',app.requireAdmin);
  app.get('/',async request=>{const q=z.object({status:z.enum(['SENT','REVIEWED']).optional(),patientId:z.uuid().optional()}).parse(request.query);const result=await app.db.query(`SELECT e.id,e.patient_id AS "patientId",p.name AS "patientName",p.email,e.title,e.exam_date AS "examDate",e.notes,e.status,e.mime_type AS "mimeType",e.file_size AS "fileSize",e.created_at AS "createdAt",e.file_path IS NOT NULL OR e.file_url IS NOT NULL AS "hasFile" FROM patient_exam_uploads e JOIN patients p ON p.id=e.patient_id WHERE ($1::text IS NULL OR e.status=$1) AND ($2::uuid IS NULL OR e.patient_id=$2) ORDER BY CASE WHEN e.status='SENT' THEN 0 ELSE 1 END,e.created_at DESC`,[q.status||null,q.patientId||null]);return{data:result.rows}});
  app.get('/:id/url',async(request,reply)=>{const{id}=params.parse(request.params);const row=(await app.db.query<{file_path:string|null;file_url:string|null}>('SELECT file_path,file_url FROM patient_exam_uploads WHERE id=$1',[id])).rows[0];if(!row)return reply.code(404).send({error:'Exame não encontrado.'});if(row.file_path){const{data,error}=await examStorage(app.env).createSignedUrl(row.file_path,300);if(error)throw error;return{data:{url:data.signedUrl}}}if(row.file_url)return{data:{url:row.file_url}};return reply.code(404).send({error:'Arquivo do exame não encontrado.'})});
  app.patch('/:id/review',async(request,reply)=>{const{id}=params.parse(request.params);const result=await app.db.query<{patientId:string}>(`UPDATE patient_exam_uploads SET status='REVIEWED' WHERE id=$1 RETURNING patient_id AS "patientId"`,[id]);if(!result.rows[0])return reply.code(404).send({error:'Exame não encontrado.'});await audit(app.db,'PATIENT_EXAM_REVIEWED','patient_exam_upload',{actorUserId:request.auth!.userId,entityId:id,metadata:{patientId:result.rows[0].patientId}});return{message:'Exame marcado como revisado.'}});
}
