import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { audit } from '../../shared/audit.js';
import { hashPassword } from '../../shared/crypto.js';
import { sendPatientAccessEmail } from '../../integrations/email.js';

const patientSchema = z.object({
  name: z.string().trim().min(2).max(160),
  cpf: z.string().transform(v => v.replace(/\D/g, '')).refine(v => !v || v.length === 11, 'CPF inválido').optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  whatsapp: z.string().transform(v => v.replace(/\D/g, '')).optional(),
  birthDate: z.iso.date().optional(),
  objective: z.string().trim().max(500).optional()
});

export async function patientRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAdmin);

  app.get('/', async request => {
    const query = z.object({ q: z.string().trim().max(100).optional() }).parse(request.query);
    const term = query.q ? `%${query.q.toLowerCase()}%` : null;
    const result = await app.db.query(
      `SELECT p.id, p.cpf, p.name, COALESCE(u.email, p.email) AS email, p.whatsapp, p.birth_date AS "birthDate",
              p.objective, p.active, p.created_at AS "createdAt", (p.user_id IS NOT NULL) AS "hasPortalAccess"
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
              p.objective, p.active, p.created_at AS "createdAt"
       FROM patients p LEFT JOIN users u ON u.id = p.user_id WHERE p.id = $1`, [id]
    );
    return result.rows[0] ? { data: result.rows[0] } : reply.code(404).send({ error: 'Paciente não encontrado.' });
  });

  app.post('/', async (request, reply) => {
    const body = patientSchema.parse(request.body);
    const result = await app.db.query<{ id: string }>(
      `INSERT INTO patients(cpf, name, email, whatsapp, birth_date, objective)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [body.cpf || null, body.name, body.email || null, body.whatsapp || null, body.birthDate || null, body.objective || null]
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
       updated_at=now() WHERE id=$7`,
      [p.cpf || null, p.name, p.email || null, p.whatsapp || null, p.birthDate ?? p.birth_date ?? null, p.objective || null, id]
    );
    await audit(app.db, 'PATIENT_UPDATED', 'patient', { actorUserId: request.auth!.userId, entityId: id, metadata: { fields: Object.keys(body) } });
    return { data: { id } };
  });

  app.post('/:id/access', async (request, reply) => {
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    const { password } = z.object({ password: z.string().min(12).max(128) }).parse(request.body);
    const patient = await app.db.query<{email:string|null;user_id:string|null;name:string}>('SELECT email,user_id,name FROM patients WHERE id=$1 AND active=true',[id]);
    const row=patient.rows[0];if(!row)return reply.code(404).send({error:'Paciente não encontrado.'});if(!row.email)return reply.code(400).send({error:'Cadastre o e-mail do paciente antes de criar o acesso.'});
    const passwordHash=await hashPassword(password);const client=await app.db.connect();try{await client.query('BEGIN');let userId=row.user_id;if(userId)await client.query(`UPDATE users SET email=$1,password_hash=$2,active=true,updated_at=now() WHERE id=$3`,[row.email.toLowerCase(),passwordHash,userId]);else{const created=await client.query<{id:string}>(`INSERT INTO users(email,password_hash,role) VALUES($1,$2,'PATIENT') RETURNING id`,[row.email.toLowerCase(),passwordHash]);userId=created.rows[0]!.id;await client.query('UPDATE patients SET user_id=$1,updated_at=now() WHERE id=$2',[userId,id])}await client.query('UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL',[userId]);await client.query('COMMIT')}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
    let emailSent=false;try{emailSent=await sendPatientAccessEmail(app.env,app.db,{to:row.email,name:row.name,temporaryPassword:password})}catch(error){app.log.error({err:error,patientId:id},'Falha ao enviar acesso do paciente')}
    await audit(app.db,'PATIENT_ACCESS_PROVISIONED','patient',{actorUserId:request.auth!.userId,entityId:id,metadata:{emailSent}});return{data:{id,email:row.email,emailSent,warning:emailSent?null:'Acesso criado, mas o e-mail não foi enviado. Verifique a configuração SMTP.'}};
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    const result = await app.db.query('UPDATE patients SET active=false, updated_at=now() WHERE id=$1 RETURNING id', [id]);
    if (!result.rows[0]) return reply.code(404).send({ error: 'Paciente não encontrado.' });
    await audit(app.db, 'PATIENT_DEACTIVATED', 'patient', { actorUserId: request.auth!.userId, entityId: id });
    return reply.code(204).send();
  });
}
