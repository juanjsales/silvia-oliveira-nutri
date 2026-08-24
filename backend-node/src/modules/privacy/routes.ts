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
  app.get('/export',async(request,reply)=>{if(request.auth!.role!=='PATIENT'||!request.auth!.patientId)return reply.code(403).send({error:'Acesso restrito ao paciente.'});const id=request.auth!.patientId;const queries:Record<string,string>={profile:'SELECT id,name,email,cpf,whatsapp,birth_date,objective,address,emergency_contact,communication_preference,profiles,profile_notes,created_at,updated_at FROM patients WHERE id=$1',appointments:'SELECT appointment_date,appointment_time,duration_minutes,appointment_type,status,notes FROM appointments WHERE patient_id=$1 ORDER BY appointment_date',encounters:'SELECT id,status,started_at,completed_at FROM clinical_encounters WHERE patient_id=$1 ORDER BY started_at',clinicalSections:'SELECT s.encounter_id,s.section_key,s.data,s.saved_at FROM clinical_sections s JOIN clinical_encounters e ON e.id=s.encounter_id WHERE e.patient_id=$1',plans:'SELECT title,objective,status,content,published_at,updated_at FROM meal_plans WHERE patient_id=$1',documents:'SELECT document_number,type,title,status,available_to_patient,issued_at FROM clinical_documents WHERE patient_id=$1',diary:'SELECT entry_date,meal_notes,symptoms,hunger,satiety,water_liters,adherence,created_at FROM patient_diary_entries WHERE patient_id=$1',exams:'SELECT title,exam_date,mime_type,file_size,notes,status,created_at FROM patient_exam_uploads WHERE patient_id=$1',messages:'SELECT sender_role,body,read_at,created_at FROM patient_messages WHERE patient_id=$1',goals:'SELECT title,description,due_date,status,completed_at FROM patient_goals WHERE patient_id=$1',measurements:'SELECT measured_at,weight,body_fat,waist,neck,visible_to_patient FROM patient_measurements WHERE patient_id=$1',finance:'SELECT description,amount,due_date,paid_at,payment_method,status FROM financial_transactions WHERE patient_id=$1'};const entries=await Promise.all(Object.entries(queries).map(async([key,sql])=>[key,(await app.db.query(sql,[id])).rows]));const data={exportedAt:new Date().toISOString(),patientId:id,...Object.fromEntries(entries)};await audit(app.db,'PATIENT_DATA_EXPORTED','patient',{actorUserId:request.auth!.userId,entityId:id});reply.header('Content-Disposition',`attachment; filename="meus-dados-${new Date().toISOString().slice(0,10)}.json"`);return data});
  app.post('/requests',async(request,reply)=>{
    if(request.auth!.role!=='PATIENT'||!request.auth!.patientId)return reply.code(403).send({error:'Acesso restrito ao paciente.'});
    const body=z.object({type:z.enum(['ACCESS','CORRECTION','DELETION','PORTABILITY','INFORMATION','REVOCATION','OBJECTION']),details:z.string().trim().max(2000).optional()}).parse(request.body);
    const result=await app.db.query<{id:string}>(`INSERT INTO data_subject_requests(patient_id,request_type,details) VALUES($1,$2,$3) RETURNING id`,[request.auth!.patientId,body.type,body.details||null]);
    const requestId = result.rows[0]!.id;
    await app.db.query(`INSERT INTO data_subject_request_history(request_id,status,notes,actor_user_id) VALUES($1,'OPEN','Solicitação registrada pelo titular.',$2)`,[requestId,request.auth!.userId]);
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
            `Tipo de Solicitação: ${label}\n` +
            `Data/Hora: ${new Date().toLocaleString('pt-BR')}\n\n` +
            `Por segurança, os dados de contato e os detalhes informados pelo titular ficam disponíveis somente na área autenticada.\n\n` +
            `Acesse as Configurações do Sistema > Suporte Técnico > Solicitações de Privacidade para revisar e responder.`
        });
        app.log.info({ requestId }, 'E-mail de aviso de privacidade enviado ao consultório com sucesso');
      }
    } catch (mailError) {
      app.log.error({ err: mailError, requestId }, 'Não foi possível enviar e-mail de aviso de privacidade ao consultório');
    }

    return reply.code(201).send({message:'Solicitação registrada para análise.',data:{id:requestId}});
  });
  app.get('/my-requests',async(request,reply)=>{if(request.auth!.role!=='PATIENT'||!request.auth!.patientId)return reply.code(403).send({error:'Acesso restrito ao paciente.'});const result=await app.db.query(`SELECT id,request_type AS type,details,status,resolution_notes AS "resolutionNotes",created_at AS "createdAt",resolved_at AS "resolvedAt" FROM data_subject_requests WHERE patient_id=$1 ORDER BY created_at DESC LIMIT 50`,[request.auth!.patientId]);return{data:result.rows}});
  app.get('/requests',async(request,reply)=>{if(request.auth!.role!=='ADMIN')return reply.code(403).send({error:'Acesso restrito.'});const result=await app.db.query(`SELECT r.id,r.patient_id AS "patientId",p.name AS "patientName",r.request_type AS type,r.details,r.status,r.resolution_notes AS "resolutionNotes",r.created_at AS "createdAt",r.resolved_at AS "resolvedAt" FROM data_subject_requests r JOIN patients p ON p.id=r.patient_id ORDER BY CASE WHEN r.status IN('OPEN','IN_REVIEW') THEN 0 ELSE 1 END,r.created_at DESC LIMIT 100`);return{data:result.rows}});
  app.patch('/requests/:id',async(request,reply)=>{
    if(request.auth!.role!=='ADMIN')return reply.code(403).send({error:'Acesso restrito.'});
    const{id}=z.object({id:z.uuid()}).parse(request.params);
    const body=z.object({status:z.enum(['IN_REVIEW','COMPLETED','REJECTED']),resolutionNotes:z.string().trim().min(3).max(2000)}).parse(request.body);
    const result=await app.db.query<{patient_id:string}>(`UPDATE data_subject_requests SET status=$1,resolution_notes=$2,resolved_at=CASE WHEN $1 IN('COMPLETED','REJECTED') THEN now() ELSE NULL END,resolved_by=$3
      WHERE id=$4 AND ((status='OPEN' AND $1='IN_REVIEW') OR (status='IN_REVIEW' AND $1 IN('COMPLETED','REJECTED'))) RETURNING patient_id`,[body.status,body.resolutionNotes,request.auth!.userId,id]);
    if(!result.rows[0]){
      const exists=await app.db.query<{status:string}>('SELECT status FROM data_subject_requests WHERE id=$1',[id]);
      if(!exists.rows[0])return reply.code(404).send({error:'Solicitação não encontrada.'});
      return reply.code(409).send({error:`Transição inválida: a solicitação está ${exists.rows[0].status}. Inicie a análise antes de concluir ou rejeitar.`});
    }
    const patientId=result.rows[0].patient_id;
    const notificationBody=body.status==='IN_REVIEW'?'Sua solicitação está em análise.':'A análise foi concluída. Consulte a área de privacidade para ver a resposta.';
    await app.db.query(`INSERT INTO patient_notifications(patient_id,title,body,kind,priority,entity_type,entity_id,action_url,dedupe_key,expires_at)
      VALUES($1,'Solicitação de privacidade atualizada',$2,'PRIVACY','HIGH','privacy_request',$3,'/portal/privacidade','privacy-request:update:'||$3||':'||$4,now()+interval '180 days')
      ON CONFLICT(patient_id,dedupe_key) WHERE dedupe_key IS NOT NULL AND status='ACTIVE'
      DO UPDATE SET body=EXCLUDED.body,read_at=NULL,expires_at=EXCLUDED.expires_at`,[patientId,notificationBody,id,body.status]);
    await audit(app.db,'DATA_SUBJECT_REQUEST_UPDATED','patient',{actorUserId:request.auth!.userId,entityId:patientId,metadata:{requestId:id,status:body.status}});
    return{data:{id}};
  });

  const adminOnly=(request:any,reply:any)=>request.auth?.role==='ADMIN'?undefined:reply.code(403).send({error:'Acesso restrito.'});
  const list=z.array(z.string().trim().min(1).max(160)).max(30).default([]);
  const activitySchema=z.object({name:z.string().trim().min(2).max(160),purpose:z.string().trim().min(3).max(2000),dataCategories:list,dataSubjects:list,legalBasis:z.string().trim().min(3).max(500),recipients:list,storageLocation:z.string().trim().max(500).optional(),retentionRule:z.string().trim().min(3).max(1000),securityMeasures:list,active:z.boolean().default(true)});
  const incidentSchema=z.object({title:z.string().trim().min(3).max(200),summary:z.string().trim().min(3).max(3000),detectedAt:z.coerce.date(),status:z.enum(['ASSESSING','CONTAINED','NOTIFICATION_REVIEW','CLOSED']),riskLevel:z.enum(['UNDER_REVIEW','LOW','MEDIUM','HIGH']),dataCategories:list,affectedSubjectsEstimate:z.number().int().nonnegative().nullable().optional(),containmentActions:z.string().trim().max(3000).optional(),assessmentNotes:z.string().trim().max(3000).optional(),notificationDecision:z.string().trim().max(3000).optional()});
  app.get('/governance', {preHandler:adminOnly}, async()=>{const[settings,activities,retention,incidents]=await Promise.all([
    app.db.query(`SELECT privacy_controller_name AS "controllerName",privacy_controller_document AS "controllerDocument",privacy_contact_name AS "contactName",privacy_contact_email AS "contactEmail",privacy_notice_updated_at AS "noticeUpdatedAt" FROM clinic_settings WHERE singleton=true`),
    app.db.query(`SELECT id,name,purpose,data_categories AS "dataCategories",data_subjects AS "dataSubjects",legal_basis AS "legalBasis",recipients,storage_location AS "storageLocation",retention_rule AS "retentionRule",security_measures AS "securityMeasures",active,updated_at AS "updatedAt" FROM privacy_processing_activities ORDER BY active DESC,name`),
    app.db.query(`SELECT id,data_category AS "dataCategory",retention_rule AS "retentionRule",legal_or_operational_reason AS reason,disposition_action AS "dispositionAction",active,updated_at AS "updatedAt" FROM privacy_retention_policies ORDER BY data_category`),
    app.db.query(`SELECT id,title,summary,detected_at AS "detectedAt",status,risk_level AS "riskLevel",data_categories AS "dataCategories",affected_subjects_estimate AS "affectedSubjectsEstimate",containment_actions AS "containmentActions",assessment_notes AS "assessmentNotes",notification_decision AS "notificationDecision",closed_at AS "closedAt",updated_at AS "updatedAt" FROM privacy_incidents ORDER BY detected_at DESC LIMIT 100`)
  ]);return{data:{settings:settings.rows[0],activities:activities.rows,retention:retention.rows,incidents:incidents.rows}}});
  app.put('/governance/settings',{preHandler:adminOnly},async request=>{const body=z.object({controllerName:z.string().trim().min(2).max(200),controllerDocument:z.string().trim().max(80).optional(),contactName:z.string().trim().min(2).max(160),contactEmail:z.email()}).parse(request.body);await app.db.query(`UPDATE clinic_settings SET privacy_controller_name=$1,privacy_controller_document=$2,privacy_contact_name=$3,privacy_contact_email=$4,privacy_notice_updated_at=now() WHERE singleton=true`,[body.controllerName,body.controllerDocument||null,body.contactName,body.contactEmail]);await audit(app.db,'PRIVACY_GOVERNANCE_SETTINGS_UPDATED','clinic_settings',{actorUserId:request.auth!.userId,entityId:'singleton'});return{message:'Configurações de privacidade atualizadas.'}});
  app.post('/processing-activities',{preHandler:adminOnly},async(request,reply)=>{const b=activitySchema.parse(request.body);const row=(await app.db.query<{id:string}>(`INSERT INTO privacy_processing_activities(name,purpose,data_categories,data_subjects,legal_basis,recipients,storage_location,retention_rule,security_measures,active,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,[b.name,b.purpose,b.dataCategories,b.dataSubjects,b.legalBasis,b.recipients,b.storageLocation||null,b.retentionRule,b.securityMeasures,b.active,request.auth!.userId])).rows[0]!;await audit(app.db,'PRIVACY_PROCESSING_ACTIVITY_CREATED','privacy_processing_activity',{actorUserId:request.auth!.userId,entityId:row.id});return reply.code(201).send({data:row})});
  app.put('/processing-activities/:id',{preHandler:adminOnly},async(request,reply)=>{const{id}=z.object({id:z.uuid()}).parse(request.params),b=activitySchema.parse(request.body);const row=(await app.db.query<{id:string}>(`UPDATE privacy_processing_activities SET name=$1,purpose=$2,data_categories=$3,data_subjects=$4,legal_basis=$5,recipients=$6,storage_location=$7,retention_rule=$8,security_measures=$9,active=$10,updated_by=$11,updated_at=now() WHERE id=$12 RETURNING id`,[b.name,b.purpose,b.dataCategories,b.dataSubjects,b.legalBasis,b.recipients,b.storageLocation||null,b.retentionRule,b.securityMeasures,b.active,request.auth!.userId,id])).rows[0];if(!row)return reply.code(404).send({error:'Atividade não encontrada.'});await audit(app.db,'PRIVACY_PROCESSING_ACTIVITY_UPDATED','privacy_processing_activity',{actorUserId:request.auth!.userId,entityId:id});return{data:row}});
  app.put('/retention/:id',{preHandler:adminOnly},async(request,reply)=>{const{id}=z.object({id:z.uuid()}).parse(request.params);const b=z.object({retentionRule:z.string().trim().min(3).max(1000),reason:z.string().trim().min(3).max(1000),dispositionAction:z.enum(['REVIEW','ANONYMIZE','DELETE','PRESERVE']),active:z.boolean()}).parse(request.body);const row=(await app.db.query<{id:string}>(`UPDATE privacy_retention_policies SET retention_rule=$1,legal_or_operational_reason=$2,disposition_action=$3,active=$4,updated_by=$5,updated_at=now() WHERE id=$6 RETURNING id`,[b.retentionRule,b.reason,b.dispositionAction,b.active,request.auth!.userId,id])).rows[0];if(!row)return reply.code(404).send({error:'Política não encontrada.'});await audit(app.db,'PRIVACY_RETENTION_UPDATED','privacy_retention_policy',{actorUserId:request.auth!.userId,entityId:id});return{data:row}});
  app.post('/incidents',{preHandler:adminOnly},async(request,reply)=>{const b=incidentSchema.parse(request.body);const row=(await app.db.query<{id:string}>(`INSERT INTO privacy_incidents(title,summary,detected_at,status,risk_level,data_categories,affected_subjects_estimate,containment_actions,assessment_notes,notification_decision,closed_at,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,CASE WHEN $4='CLOSED' THEN now() ELSE NULL END,$11,$11) RETURNING id`,[b.title,b.summary,b.detectedAt,b.status,b.riskLevel,b.dataCategories,b.affectedSubjectsEstimate??null,b.containmentActions||null,b.assessmentNotes||null,b.notificationDecision||null,request.auth!.userId])).rows[0]!;await audit(app.db,'PRIVACY_INCIDENT_CREATED','privacy_incident',{actorUserId:request.auth!.userId,entityId:row.id,metadata:{status:b.status,riskLevel:b.riskLevel}});return reply.code(201).send({data:row})});
  app.put('/incidents/:id',{preHandler:adminOnly},async(request,reply)=>{const{id}=z.object({id:z.uuid()}).parse(request.params),b=incidentSchema.parse(request.body);const row=(await app.db.query<{id:string}>(`UPDATE privacy_incidents SET title=$1,summary=$2,detected_at=$3,status=$4,risk_level=$5,data_categories=$6,affected_subjects_estimate=$7,containment_actions=$8,assessment_notes=$9,notification_decision=$10,closed_at=CASE WHEN $4='CLOSED' THEN COALESCE(closed_at,now()) ELSE NULL END,updated_by=$11,updated_at=now() WHERE id=$12 RETURNING id`,[b.title,b.summary,b.detectedAt,b.status,b.riskLevel,b.dataCategories,b.affectedSubjectsEstimate??null,b.containmentActions||null,b.assessmentNotes||null,b.notificationDecision||null,request.auth!.userId,id])).rows[0];if(!row)return reply.code(404).send({error:'Incidente não encontrado.'});await audit(app.db,'PRIVACY_INCIDENT_UPDATED','privacy_incident',{actorUserId:request.auth!.userId,entityId:id,metadata:{status:b.status,riskLevel:b.riskLevel}});return{data:row}});
}
