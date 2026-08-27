import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { audit } from '../../shared/audit.js';
import { createOpaqueToken, hashPassword, hashToken } from '../../shared/crypto.js';
import { sendPatientInvitationEmail } from '../../integrations/email.js';
import { capitalizePersonName } from '../../shared/formatters.js';

const patientProfile = z.enum([
  'CHILD', 'ADOLESCENT_YOUNG', 'ADULT_MAN', 'ADULT_WOMAN', 'PREGNANT',
  'POSTPARTUM_BREASTFEEDING', 'OLDER_ADULT', 'ATHLETE', 'VEGETARIAN_VEGAN',
  'BARIATRIC_CARE', 'OTHER'
]);

const patientSchema = z.object({
  name: z.string().trim().min(2).max(160).transform(capitalizePersonName),
  cpf: z.string().transform(v => v.replace(/\D/g, '')).refine(v => !v || v.length === 11, 'CPF inválido').optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  whatsapp: z.string().transform(v => v.replace(/\D/g, '')).optional(),
  birthDate: z.iso.date().optional(),
  objective: z.string().trim().max(500).optional(),
  profiles: z.array(patientProfile).max(11).default([]),
  profileNotes: z.string().trim().max(500).optional()
});

export async function patientRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAdmin);

  app.get('/', async request => {
    const query = z.object({ q: z.string().trim().max(100).optional() }).parse(request.query);
    const term = query.q ? `%${query.q.toLowerCase()}%` : null;
    const result = await app.db.query(
      `SELECT p.id, p.cpf, p.name, COALESCE(u.email, p.email) AS email, p.whatsapp, p.birth_date AS "birthDate",
              p.objective, p.profiles, p.profile_notes AS "profileNotes", p.active, p.created_at AS "createdAt", (p.user_id IS NOT NULL AND u.active) AS "hasPortalAccess"
       FROM patients p LEFT JOIN users u ON u.id = p.user_id
       WHERE ($1::text IS NULL OR lower(p.name) LIKE $1 OR p.cpf LIKE $1)
       ORDER BY p.name LIMIT 100`,
      [term]
    );
    return { data: result.rows };
  });

  app.get('/:id', async (request, reply) => {
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    const result = await app.db.query(
      `SELECT p.id, p.cpf, p.name, COALESCE(u.email, p.email) AS email, p.whatsapp, p.birth_date AS "birthDate",
              p.objective, p.profiles, p.profile_notes AS "profileNotes", p.active, p.created_at AS "createdAt"
       FROM patients p LEFT JOIN users u ON u.id = p.user_id WHERE p.id = $1`, [id]
    );
    return result.rows[0] ? { data: result.rows[0] } : reply.code(404).send({ error: 'Paciente não encontrado.' });
  });

  app.post('/', async (request, reply) => {
    const body = patientSchema.parse(request.body);
    const result = await app.db.query<{ id: string }>(
      `INSERT INTO patients(cpf, name, email, whatsapp, birth_date, objective, profiles, profile_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [body.cpf || null, body.name, body.email || null, body.whatsapp || null, body.birthDate || null, body.objective || null, body.profiles, body.profileNotes || null]
    );
    const id = result.rows[0]!.id;
    await audit(app.db, 'PATIENT_CREATED', 'patient', { actorUserId: request.auth!.userId, entityId: id });
    return reply.code(201).send({ data: { id } });
  });

  app.patch('/:id', async (request, reply) => {
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    const body = patientSchema.partial().parse(request.body);
    const current = await app.db.query('SELECT * FROM patients WHERE id = $1', [id]);
    if (!current.rows[0]) return reply.code(404).send({ error: 'Paciente não encontrado.' });
    const p = { ...current.rows[0], ...body };
    await app.db.query(
      `UPDATE patients SET cpf=$1, name=$2, email=$3, whatsapp=$4, birth_date=$5, objective=$6,
       profiles=$7, profile_notes=$8, updated_at=now() WHERE id=$9`,
      [p.cpf || null, p.name, p.email || null, p.whatsapp || null, p.birthDate ?? p.birth_date ?? null, p.objective || null,
       p.profiles ?? [], body.profileNotes !== undefined ? body.profileNotes || null : p.profile_notes ?? null, id]
    );
    await audit(app.db, 'PATIENT_UPDATED', 'patient', { actorUserId: request.auth!.userId, entityId: id, metadata: { fields: Object.keys(body) } });
    return { data: { id } };
  });

  app.post('/:id/access', async (request, reply) => {
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    const patient = await app.db.query<{email:string|null;user_id:string|null;name:string}>('SELECT email,user_id,name FROM patients WHERE id=$1 AND active=true',[id]);
    const row=patient.rows[0];if(!row)return reply.code(404).send({error:'Paciente não encontrado.'});if(!row.email)return reply.code(400).send({error:'Cadastre o e-mail do paciente antes de criar o acesso.'});
    const rawToken=createOpaqueToken();const expiresAt=new Date(Date.now()+app.env.PATIENT_INVITATION_TTL_HOURS*3_600_000);const client=await app.db.connect();let userId=row.user_id;let createdUser=false;
    try{await client.query('BEGIN');if(userId){await client.query('UPDATE users SET email=$1,updated_at=now() WHERE id=$2',[row.email.toLowerCase(),userId])}else{const placeholderHash=await hashPassword(createOpaqueToken());const created=await client.query<{id:string}>(`INSERT INTO users(email,password_hash,role,active) VALUES($1,$2,'PATIENT',false) RETURNING id`,[row.email.toLowerCase(),placeholderHash]);userId=created.rows[0]!.id;createdUser=true;await client.query('UPDATE patients SET user_id=$1,updated_at=now() WHERE id=$2',[userId,id])}await client.query('DELETE FROM password_reset_tokens WHERE user_id=$1 AND used_at IS NULL',[userId]);await client.query('INSERT INTO password_reset_tokens(user_id,token_hash,expires_at) VALUES($1,$2,$3)',[userId,hashToken(rawToken),expiresAt]);await client.query('COMMIT')}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
    try{const emailSent=await sendPatientInvitationEmail(app.env,app.db,{to:row.email,name:row.name,token:rawToken});if(!emailSent)throw new Error('SMTP não configurado ou desativado.')}catch(error){const errorName=error instanceof Error?error.name:'UnknownError';const errorCode=typeof error==='object'&&error!==null&&'code' in error?String(error.code).slice(0,80):undefined;app.log.error({errorName,errorCode,patientId:id},'Falha ao enviar convite do paciente');const cleanup=await app.db.connect();try{await cleanup.query('BEGIN');await cleanup.query('DELETE FROM password_reset_tokens WHERE user_id=$1 AND token_hash=$2',[userId,hashToken(rawToken)]);if(createdUser){await cleanup.query('UPDATE patients SET user_id=NULL,updated_at=now() WHERE id=$1 AND user_id=$2',[id,userId]);await cleanup.query('DELETE FROM users WHERE id=$1 AND active=false',[userId])}await cleanup.query('COMMIT')}catch(cleanupError){await cleanup.query('ROLLBACK');const cleanupErrorName=cleanupError instanceof Error?cleanupError.name:'UnknownError';const cleanupErrorCode=typeof cleanupError==='object'&&cleanupError!==null&&'code' in cleanupError?String(cleanupError.code).slice(0,80):undefined;app.log.error({errorName:cleanupErrorName,errorCode:cleanupErrorCode,patientId:id},'Falha ao desfazer convite não enviado')}finally{cleanup.release()}return reply.code(502).send({error:'O convite não foi enviado. Nenhuma senha foi alterada; verifique o SMTP e tente novamente.'})}
    await audit(app.db,'PATIENT_ACCESS_INVITED','patient',{actorUserId:request.auth!.userId,entityId:id,metadata:{emailSent:true}});return{data:{id,email:row.email,emailSent:true}};
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    const result = await app.db.query('UPDATE patients SET active=false, updated_at=now() WHERE id=$1 RETURNING id', [id]);
    if (!result.rows[0]) return reply.code(404).send({ error: 'Paciente não encontrado.' });
    await audit(app.db, 'PATIENT_DEACTIVATED', 'patient', { actorUserId: request.auth!.userId, entityId: id });
    return reply.code(204).send();
  });
}
