import { createHash } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { audit } from '../../shared/audit.js';

const key=z.string().trim().min(8).max(128).regex(/^[A-Za-z0-9._:-]+$/);
const tenantSchema=z.object({idempotencyKey:key,slug:z.string().trim().min(2).max(63).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),name:z.string().trim().min(2).max(160),contactEmail:z.string().trim().max(254).pipe(z.email()).transform(v=>v.toLowerCase())}).strict();
const jobSchema=z.object({idempotencyKey:key,operation:z.enum(['PROVISION_TENANT','REPAIR_TENANT']).default('PROVISION_TENANT'),request:z.object({databaseRegion:z.string().trim().min(2).max(40).optional(),hostingRegion:z.string().trim().min(2).max(40).optional()}).strict().default({})}).strict();
const completeSchema=z.object({outcome:z.enum(['SUCCEEDED','FAILED']),summary:z.object({message:z.string().trim().max(500).optional(),checks:z.array(z.string().trim().min(1).max(100)).max(30).optional()}).strict().default({})}).strict();
const idSchema=z.object({id:z.uuid()}).strict();
const fingerprint=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

export async function platformRoutes(app:FastifyInstance){
  const requirePlatform=async(request:FastifyRequest,reply:FastifyReply)=>{
    await app.authenticate(request,reply); if(reply.sent)return;
    const allowed=await app.db.query<{allowed:boolean}>(`SELECT EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id JOIN role_permissions rp ON rp.role_id=r.id JOIN permissions p ON p.id=rp.permission_id WHERE ur.user_id=$1 AND r.code='PLATFORM_ADMIN' AND p.code='platform:manage') AS allowed`,[request.auth!.userId]);
    if(allowed.rows[0]?.allowed!==true)return reply.code(403).send({error:'Acesso restrito à administração da plataforma.'});
  };
  app.addHook('preHandler',requirePlatform);

  app.get('/tenants',async()=>({data:(await app.db.query(`SELECT id,slug,name,contact_email AS "contactEmail",status,created_at AS "createdAt",updated_at AS "updatedAt" FROM platform_tenants ORDER BY created_at DESC LIMIT 200`)).rows}));
  app.post('/tenants',async(request,reply)=>{
    const body=tenantSchema.parse(request.body); const fp=fingerprint({slug:body.slug,name:body.name,contactEmail:body.contactEmail});
    const result=await app.db.query<{id:string;status:string;idempotent:boolean}>(`INSERT INTO platform_tenants(slug,name,contact_email,creation_key,creation_fingerprint,created_by) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(creation_key) DO UPDATE SET creation_key=EXCLUDED.creation_key WHERE platform_tenants.creation_fingerprint=EXCLUDED.creation_fingerprint RETURNING id,status,(xmax<>0) AS idempotent`,[body.slug,body.name,body.contactEmail,body.idempotencyKey,fp,request.auth!.userId]);
    const tenant=result.rows[0];if(!tenant)return reply.code(409).send({error:'A chave de idempotência já foi usada com outros dados.'});
    if(!tenant.idempotent)await audit(app.db,'PLATFORM_TENANT_CREATED','platform_tenant',{actorUserId:request.auth!.userId,entityId:tenant.id,metadata:{slug:body.slug}});
    return reply.code(tenant.idempotent?200:201).send({data:tenant});
  });

  app.post('/tenants/:id/jobs',async(request,reply)=>{
    const{id}=idSchema.parse(request.params); const body=jobSchema.parse(request.body); const fp=fingerprint({operation:body.operation,request:body.request});
    const created=await app.db.query<{id:string;status:string;idempotent:boolean}>(`INSERT INTO provisioning_jobs(tenant_id,operation,idempotency_key,request_fingerprint,request_payload,requested_by) SELECT id,$2,$3,$4,$5,$6 FROM platform_tenants WHERE id=$1 AND status IN('DRAFT','READY','FAILED') ON CONFLICT(tenant_id,idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key WHERE provisioning_jobs.request_fingerprint=EXCLUDED.request_fingerprint RETURNING id,status,(xmax<>0) AS idempotent`,[id,body.operation,body.idempotencyKey,fp,body.request,request.auth!.userId]);
    const job=created.rows[0];if(!job)return reply.code(409).send({error:'Tenant indisponível ou chave de idempotência reutilizada com outro job.'});
    if(!job.idempotent)await audit(app.db,'PROVISIONING_JOB_QUEUED','provisioning_job',{actorUserId:request.auth!.userId,entityId:job.id,metadata:{tenantId:id,operation:body.operation}});return reply.code(job.idempotent?200:201).send({data:job});
  });

  app.get('/jobs',async()=>({data:(await app.db.query(`SELECT j.id,j.tenant_id AS "tenantId",t.slug,j.operation,j.status,j.attempt_count AS "attemptCount",j.available_at AS "availableAt",j.started_at AS "startedAt",j.completed_at AS "completedAt",j.result_summary AS "resultSummary",j.created_at AS "createdAt" FROM provisioning_jobs j JOIN platform_tenants t ON t.id=j.tenant_id ORDER BY j.created_at DESC LIMIT 200`)).rows}));
  app.post('/jobs/:id/start',async(request,reply)=>{
    const{id}=idSchema.parse(request.params);const row=(await app.db.query<{id:string;status:string}>(`WITH claimed AS (UPDATE provisioning_jobs SET status='RUNNING',started_by=$2,started_at=now(),attempt_count=attempt_count+1,updated_at=now() WHERE id=$1 AND status='PENDING' AND available_at<=now() RETURNING id,tenant_id,status) UPDATE platform_tenants t SET status='PROVISIONING',updated_at=now() FROM claimed c WHERE t.id=c.tenant_id RETURNING c.id,c.status`,[id,request.auth!.userId])).rows[0];
    if(!row)return reply.code(409).send({error:'Job inexistente, indisponível ou já iniciado.'});await audit(app.db,'PROVISIONING_JOB_STARTED','provisioning_job',{actorUserId:request.auth!.userId,entityId:id});return{data:row};
  });
  app.post('/jobs/:id/complete',async(request,reply)=>{
    const{id}=idSchema.parse(request.params);const body=completeSchema.parse(request.body);const row=(await app.db.query<{id:string;tenantId:string;status:string}>(`WITH finished AS (UPDATE provisioning_jobs SET status=$2,result_summary=$3,completed_by=$4,completed_at=now(),updated_at=now() WHERE id=$1 AND status='RUNNING' RETURNING id,tenant_id,status) UPDATE platform_tenants t SET status=$5,updated_at=now() FROM finished f WHERE t.id=f.tenant_id RETURNING f.id,f.tenant_id AS "tenantId",f.status`,[id,body.outcome,body.summary,request.auth!.userId,body.outcome==='SUCCEEDED'?'READY':'FAILED'])).rows[0];
    if(!row)return reply.code(409).send({error:'Job inexistente ou fora do estado RUNNING.'});await audit(app.db,'PROVISIONING_JOB_COMPLETED','provisioning_job',{actorUserId:request.auth!.userId,entityId:id,metadata:{tenantId:row.tenantId,outcome:body.outcome}});return{data:row};
  });
}
