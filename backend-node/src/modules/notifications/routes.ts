import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const params = z.object({ id: z.uuid() });

export async function notificationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAdmin);

  app.get('/', async request => {
    const query = z.object({ status:z.enum(['ACTIVE','RESOLVED','ARCHIVED','ALL']).default('ACTIVE'), limit:z.coerce.number().int().min(1).max(100).default(50) }).parse(request.query);
    await app.db.query(`INSERT INTO professional_notifications(kind,title,body,priority,entity_type,entity_id,action_url,dedupe_key)
      SELECT 'APPOINTMENT_REQUEST','Novo pedido de consulta','Pedido enviado por '||p.name||'.','HIGH','appointment_request',r.id,'/atendimentos','appointment-request:'||r.id
      FROM appointment_requests r JOIN patients p ON p.id=r.patient_id WHERE r.status='PENDING'
      ON CONFLICT(dedupe_key) DO UPDATE SET status=CASE WHEN professional_notifications.status='ARCHIVED' THEN 'ARCHIVED' ELSE 'ACTIVE' END,updated_at=now()`);
    await app.db.query(`INSERT INTO professional_notifications(kind,title,body,priority,entity_type,entity_id,action_url,dedupe_key)
      SELECT 'MESSAGE','Nova mensagem de '||p.name,left(m.body,180),'NORMAL','patient_message',m.id,'/mensagens','message:'||m.id
      FROM patient_messages m JOIN patients p ON p.id=m.patient_id WHERE m.sender_role='PATIENT' AND m.read_at IS NULL
      ON CONFLICT(dedupe_key) DO UPDATE SET status=CASE WHEN professional_notifications.status='ARCHIVED' THEN 'ARCHIVED' ELSE 'ACTIVE' END,updated_at=now()`);
    await app.db.query(`INSERT INTO professional_notifications(kind,title,body,priority,entity_type,entity_id,action_url,dedupe_key)
      SELECT 'PRIVACY','Solicitação de privacidade de '||p.name,COALESCE(r.details,'Nova solicitação LGPD aguardando análise.'),'HIGH','privacy_request',r.id,'/configuracoes','privacy:'||r.id
      FROM data_subject_requests r JOIN patients p ON p.id=r.patient_id WHERE r.status IN('OPEN','IN_REVIEW')
      ON CONFLICT(dedupe_key) DO UPDATE SET status=CASE WHEN professional_notifications.status='ARCHIVED' THEN 'ARCHIVED' ELSE 'ACTIVE' END,updated_at=now()`);
    await app.db.query(`INSERT INTO professional_notifications(kind,title,body,priority,entity_type,action_url,dedupe_key)
      SELECT 'FINANCE','Cobranças vencidas',count(*)||' cobrança(s) aguardando regularização.','HIGH','finance','/financeiro','finance:overdue'
      FROM financial_transactions WHERE status='OVERDUE' HAVING count(*)>0
      ON CONFLICT(dedupe_key) DO UPDATE SET body=EXCLUDED.body,status=CASE WHEN professional_notifications.status='ARCHIVED' THEN 'ARCHIVED' ELSE 'ACTIVE' END,updated_at=now()`);
    await app.db.query(`UPDATE professional_notifications SET status='RESOLVED',resolved_at=COALESCE(resolved_at,now()),updated_at=now() WHERE dedupe_key='finance:overdue' AND status='ACTIVE' AND NOT EXISTS(SELECT 1 FROM financial_transactions WHERE status='OVERDUE')`);
    await app.db.query(`INSERT INTO professional_notifications(kind,title,body,priority,entity_type,entity_id,action_url,dedupe_key)
      SELECT 'CHECKIN','Check-in de '||p.name,'Respostas pré-consulta prontas para revisão.','HIGH','preconsult_checkin',c.id,'/pacientes/'||c.patient_id||'/clinico','checkin:'||c.id
      FROM preconsult_checkins c JOIN patients p ON p.id=c.patient_id WHERE c.status='PENDING_REVIEW'
      ON CONFLICT(dedupe_key) DO UPDATE SET status=CASE WHEN professional_notifications.status='ARCHIVED' THEN 'ARCHIVED' ELSE 'ACTIVE' END,updated_at=now()`);
    await app.db.query(`INSERT INTO professional_notifications(kind,title,body,priority,entity_type,entity_id,action_url,dedupe_key)
      SELECT 'EXAM','Novo exame de '||p.name,e.title,'NORMAL','patient_exam',e.id,'/exames','exam:'||e.id
      FROM patient_exam_uploads e JOIN patients p ON p.id=e.patient_id WHERE e.status='SENT'
      ON CONFLICT(dedupe_key) DO UPDATE SET status=CASE WHEN professional_notifications.status='ARCHIVED' THEN 'ARCHIVED' ELSE 'ACTIVE' END,updated_at=now()`);
    await app.db.query(`UPDATE professional_notifications n SET status='RESOLVED',resolved_at=COALESCE(resolved_at,now()),updated_at=now()
      WHERE status='ACTIVE' AND ((entity_type='appointment_request' AND NOT EXISTS(SELECT 1 FROM appointment_requests r WHERE r.id=n.entity_id AND r.status='PENDING')) OR (entity_type='preconsult_checkin' AND NOT EXISTS(SELECT 1 FROM preconsult_checkins c WHERE c.id=n.entity_id AND c.status='PENDING_REVIEW')) OR (entity_type='patient_exam' AND NOT EXISTS(SELECT 1 FROM patient_exam_uploads e WHERE e.id=n.entity_id AND e.status='SENT')) OR (entity_type='patient_message' AND NOT EXISTS(SELECT 1 FROM patient_messages m WHERE m.id=n.entity_id AND m.read_at IS NULL)) OR (entity_type='privacy_request' AND NOT EXISTS(SELECT 1 FROM data_subject_requests r WHERE r.id=n.entity_id AND r.status IN('OPEN','IN_REVIEW'))))`);
    const result = await app.db.query(`SELECT id,kind AS type,title,body AS detail,priority,entity_type AS "entityType",entity_id AS "entityId",action_url AS link,status,read_at AS "readAt",resolved_at AS "resolvedAt",created_at AS "createdAt"
      FROM professional_notifications WHERE ($1='ALL' OR status=$1) ORDER BY CASE priority WHEN 'URGENT' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'NORMAL' THEN 2 ELSE 3 END,created_at DESC LIMIT $2`,[query.status,query.limit]);
    return { data:result.rows };
  });

  app.patch('/:id/read', async (request, reply) => {
    const {id}=params.parse(request.params);
    const result=await app.db.query('UPDATE professional_notifications SET read_at=COALESCE(read_at,now()),updated_at=now() WHERE id=$1 AND status<>\'ARCHIVED\' RETURNING id',[id]);
    return result.rows[0]?reply.code(204).send():reply.code(404).send({error:'Notificação não encontrada.'});
  });
  app.patch('/read-all', async (_request, reply) => { await app.db.query("UPDATE professional_notifications SET read_at=COALESCE(read_at,now()),updated_at=now() WHERE status='ACTIVE' AND read_at IS NULL"); return reply.code(204).send(); });
  app.patch('/:id/archive', async (request, reply) => {
    const {id}=params.parse(request.params);
    const result=await app.db.query("UPDATE professional_notifications SET status='ARCHIVED',archived_at=now(),read_at=COALESCE(read_at,now()),updated_at=now() WHERE id=$1 RETURNING id",[id]);
    return result.rows[0]?reply.code(204).send():reply.code(404).send({error:'Notificação não encontrada.'});
  });
}
