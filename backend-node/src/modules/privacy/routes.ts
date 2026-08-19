import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { audit } from '../../shared/audit.js';
import { loadSmtpConfig, smtpTransport } from '../../integrations/configured-email.js';

const NOTICE_VERSION='2026-08-01';
const notice={version:NOTICE_VERSION,title:'Aviso de privacidade do Portal Nutricional',summary:'Seus dados são usados para cadastro, atendimento nutricional, comunicação, documentos, acompanhamento e obrigações profissionais. Dados clínicos recebem acesso restrito e não são excluídos automaticamente quando existe obrigação de conservação. Você pode solicitar acesso, correção ou análise de exclusão pelo portal.'};

export async function privacyRoutes(app:FastifyInstance){
  app.addHook('preHandler',app.authenticate);
  app.get('/notice',async request=>{if(request.auth!.role!=='PATIENT')return{data:{notice,acknowledged:true,acknowledgedAt:null}};const result=await app.db.query<{acknowledgedAt:Date}>(`SELECT acknowledged_at AS "acknowledgedAt" FROM privacy_acknowledgements WHERE patient_id=$1 AND notice_version=$2`,[request.auth!.patientId,NOTICE_VERSION]);return{data:{notice,acknowledged:Boolean(result.rows[0]),acknowledgedAt:result.rows[0]?.acknowledgedAt??null}}});
  app.post('/acknowledge',async(request,reply)=>{if(request.auth!.role!=='PATIENT'||!request.auth!.patientId)return reply.code(403).send({error:'Acesso restrito ao paciente.'});await app.db.query(`INSERT INTO privacy_acknowledgements(patient_id,user_id,notice_version) VALUES($1,$2,$3) ON CONFLICT(patient_id,notice_version) DO NOTHING`,[request.auth!.patientId,request.auth!.userId,NOTICE_VERSION]);await audit(app.db,'PRIVACY_NOTICE_ACKNOWLEDGED','patient',{actorUserId:request.auth!.userId,entityId:request.auth!.patientId,metadata:{version:NOTICE_VERSION}});return{message:'Ciência registrada.'}});
  app.get('/export',async(request,reply)=>{if(request.auth!.role!=='PATIENT'||!request.auth!.patientId)return reply.code(403).send({error:'Acesso restrito ao paciente.'});const id=request.auth!.patientId;const queries:Record<string,string>={profile:'SELECT id,name,email,cpf,whatsapp,birth_date,objective,address,emergency_contact,communication_preference,created_at,updated_at FROM patients WHERE id=$1',appointments:'SELECT appointment_date,appointment_time,duration_minutes,appointment_type,status,notes FROM appointments WHERE patient_id=$1 ORDER BY appointment_date',encounters:'SELECT id,status,started_at,completed_at FROM clinical_encounters WHERE patient_id=$1 ORDER BY started_at',clinicalSections:'SELECT s.encounter_id,s.section_key,s.data,s.saved_at FROM clinical_sections s JOIN clinical_encounters e ON e.id=s.encounter_id WHERE e.patient_id=$1',plans:'SELECT title,objective,status,content,published_at,updated_at FROM meal_plans WHERE patient_id=$1',documents:'SELECT document_number,type,title,status,available_to_patient,issued_at FROM clinical_documents WHERE patient_id=$1',diary:'SELECT entry_date,meal_notes,symptoms,hunger,satiety,water_liters,adherence,created_at FROM patient_diary_entries WHERE patient_id=$1',exams:'SELECT title,exam_date,mime_type,file_size,notes,status,created_at FROM patient_exam_uploads WHERE patient_id=$1',messages:'SELECT sender_role,body,read_at,created_at FROM patient_messages WHERE patient_id=$1',goals:'SELECT title,description,due_date,status,completed_at FROM patient_goals WHERE patient_id=$1',measurements:'SELECT measured_at,weight,body_fat,waist,visible_to_patient FROM patient_measurements WHERE patient_id=$1',finance:'SELECT description,amount,due_date,paid_at,payment_method,status FROM financial_transactions WHERE patient_id=$1'};const entries=await Promise.all(Object.entries(queries).map(async([key,sql])=>[key,(await app.db.query(sql,[id])).rows]));const data={exportedAt:new Date().toISOString(),patientId:id,...Object.fromEntries(entries)};await audit(app.db,'PATIENT_DATA_EXPORTED','patient',{actorUserId:request.auth!.userId,entityId:id});reply.header('Content-Disposition',`attachment; filename="meus-dados-${new Date().toISOString().slice(0,10)}.json"`);return data});
  app.post('/requests',async(request,reply)=>{
    if(request.auth!.role!=='PATIENT'||!request.auth!.patientId)return reply.code(403).send({error:'Acesso restrito ao paciente.'});
    const body=z.object({type:z.enum(['ACCESS','CORRECTION','DELETION']),details:z.string().trim().max(2000).optional()}).parse(request.body);
    const result=await app.db.query<{id:string}>(`INSERT INTO data_subject_requests(patient_id,request_type,details) VALUES($1,$2,$3) RETURNING id`,[request.auth!.patientId,body.type,body.details||null]);
    const requestId = result.rows[0]!.id;
    await audit(app.db,'DATA_SUBJECT_REQUEST_CREATED','patient',{actorUserId:request.auth!.userId,entityId:request.auth!.patientId,metadata:{requestId,type:body.type}});

    // Notificar o consultório / nutricionista por e-mail via SMTP
    try {
      const [patientData, clinicData, smtpConfig] = await Promise.all([
        app.db.query<{ name: string; email: string | null }>(`SELECT name, email FROM patients WHERE id=$1`, [request.auth!.patientId]),
        app.db.query<{ email: string | null; clinic_name: string }>(`SELECT email, clinic_name FROM clinic_settings WHERE singleton=true`),
        loadSmtpConfig(app.db, app.env)
      ]);

      const patient = patientData.rows[0];
      const clinic = clinicData.rows[0];
      const targetEmail = clinic?.email || smtpConfig?.user;

      if (smtpConfig && targetEmail) {
        const typeLabels: Record<string, string> = {
          ACCESS: 'Acesso / Cópia Integral de Dados',
          CORRECTION: 'Correção / Retificação de Dados',
          DELETION: 'Eliminação / Exclusão de Dados'
        };
        const label = typeLabels[body.type] || body.type;

        await smtpTransport(smtpConfig).sendMail({
          from: smtpConfig.from,
          to: targetEmail,
          subject: `🚨 [LGPD] Nova Solicitação de Privacidade: ${label} — ${patient?.name || 'Paciente'}`,
          text: `Olá!\n\nUma nova solicitação de privacidade (LGPD) foi registrada no Portal do Paciente.\n\n` +
            `Paciente: ${patient?.name || 'Paciente'}\n` +
            `E-mail do Paciente: ${patient?.email || 'Não informado'}\n` +
            `Tipo de Solicitação: ${label}\n` +
            `Detalhes: ${body.details || 'Nenhum detalhe adicional informado.'}\n` +
            `Data/Hora: ${new Date().toLocaleString('pt-BR')}\n\n` +
            `Acesse as Configurações do Sistema > Suporte Técnico > Solicitações de Privacidade para revisar e responder.`
        });
        app.log.info({ requestId, targetEmail }, 'E-mail de aviso de privacidade enviado ao consultório com sucesso');
      }
    } catch (mailError) {
      app.log.error({ err: mailError, requestId }, 'Não foi possível enviar e-mail de aviso de privacidade ao consultório');
    }

    return reply.code(201).send({message:'Solicitação registrada para análise.',data:{id:requestId}});
  });
  app.get('/my-requests',async(request,reply)=>{if(request.auth!.role!=='PATIENT'||!request.auth!.patientId)return reply.code(403).send({error:'Acesso restrito ao paciente.'});const result=await app.db.query(`SELECT id,request_type AS type,details,status,resolution_notes AS "resolutionNotes",created_at AS "createdAt",resolved_at AS "resolvedAt" FROM data_subject_requests WHERE patient_id=$1 ORDER BY created_at DESC LIMIT 50`,[request.auth!.patientId]);return{data:result.rows}});
  app.get('/requests',async(request,reply)=>{if(request.auth!.role!=='ADMIN')return reply.code(403).send({error:'Acesso restrito.'});const result=await app.db.query(`SELECT r.id,r.patient_id AS "patientId",p.name AS "patientName",r.request_type AS type,r.details,r.status,r.resolution_notes AS "resolutionNotes",r.created_at AS "createdAt",r.resolved_at AS "resolvedAt" FROM data_subject_requests r JOIN patients p ON p.id=r.patient_id ORDER BY CASE WHEN r.status IN('OPEN','IN_REVIEW') THEN 0 ELSE 1 END,r.created_at DESC LIMIT 100`);return{data:result.rows}});
  app.patch('/requests/:id',async(request,reply)=>{if(request.auth!.role!=='ADMIN')return reply.code(403).send({error:'Acesso restrito.'});const{id}=z.object({id:z.uuid()}).parse(request.params);const body=z.object({status:z.enum(['IN_REVIEW','COMPLETED','REJECTED']),resolutionNotes:z.string().trim().min(3).max(2000)}).parse(request.body);const result=await app.db.query<{patient_id:string}>(`UPDATE data_subject_requests SET status=$1,resolution_notes=$2,resolved_at=CASE WHEN $1 IN('COMPLETED','REJECTED') THEN now() ELSE NULL END,resolved_by=$3 WHERE id=$4 RETURNING patient_id`,[body.status,body.resolutionNotes,request.auth!.userId,id]);if(!result.rows[0])return reply.code(404).send({error:'Solicitação não encontrada.'});await app.db.query(`INSERT INTO patient_notifications(patient_id,title,body,kind) VALUES($1,'Solicitação de privacidade atualizada',$2,'PRIVACY')`,[result.rows[0].patient_id,body.status==='IN_REVIEW'?'Sua solicitação está em análise.':'A análise foi concluída. Consulte a área de privacidade para ver a resposta.']);await audit(app.db,'DATA_SUBJECT_REQUEST_UPDATED','patient',{actorUserId:request.auth!.userId,entityId:result.rows[0].patient_id,metadata:{requestId:id,status:body.status}});return{data:{id}}});
}
