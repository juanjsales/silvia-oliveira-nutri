import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createOpaqueToken, hashPassword, hashToken } from '../../shared/crypto.js';
import { audit } from '../../shared/audit.js';

const inviteSchema = z.object({
  email: z.string().trim().max(254).pipe(z.email()).transform(value => value.toLowerCase()),
  displayName: z.string().trim().min(2).max(160),
  roleCode: z.enum(['NUTRITIONIST', 'RECEPTIONIST']),
  expiresInHours: z.number().int().min(1).max(168).default(48),
}).strict();

const idSchema = z.object({ id: z.uuid() }).strict();
const acceptSchema = z.object({
  token: z.string().min(32).max(512),
  password: z.string().min(12).max(128),
}).strict();

export async function staffRoutes(app: FastifyInstance) {
  app.post('/invites/accept', {
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const body = acceptSchema.parse(request.body);
    const tokenHash = hashToken(body.token);
    const client = await app.db.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<{
        id:string;email:string;displayName:string;roleId:string;roleCode:string;status:string;
        expiresAt:Date;acceptedByUserId:string|null;invitedBy:string;
      }>(`SELECT si.id,si.email,si.display_name AS "displayName",si.role_id AS "roleId",r.code AS "roleCode",
          si.status,si.expires_at AS "expiresAt",si.accepted_by_user_id AS "acceptedByUserId",si.invited_by AS "invitedBy"
        FROM staff_invites si JOIN roles r ON r.id=si.role_id
        WHERE si.token_hash=$1 FOR UPDATE`, [tokenHash]);
      const invite = result.rows[0];
      if (!invite) {
        await client.query('ROLLBACK');
        return reply.code(400).send({ error: 'Convite inválido.' });
      }
      if (invite.status === 'ACCEPTED' && invite.acceptedByUserId) {
        await client.query('COMMIT');
        return { data:{ inviteId:invite.id, userId:invite.acceptedByUserId, status:'PENDING_ACTIVATION' }, message:'Convite já confirmado. O acesso profissional continua inativo.' };
      }
      if (invite.status !== 'PENDING') {
        await client.query('ROLLBACK');
        return reply.code(409).send({ error: 'Este convite não está mais disponível.' });
      }
      if (new Date(invite.expiresAt).getTime() <= Date.now()) {
        await client.query(`UPDATE staff_invites SET status='EXPIRED',updated_at=now() WHERE id=$1`, [invite.id]);
        await audit(client, 'STAFF_INVITE_EXPIRED', 'staff_invite', { entityId:invite.id });
        await client.query('COMMIT');
        return reply.code(410).send({ error: 'Este convite expirou.' });
      }

      // Fail closed while users.role is still the legacy ADMIN/PATIENT enum.
      // The identity cannot authenticate because active=false; PATIENT avoids
      // granting the legacy ADMIN permission bypass before a later migration.
      const user = await client.query<{id:string}>(
        `INSERT INTO users(email,password_hash,role,active) VALUES($1,$2,'PATIENT',false)
         ON CONFLICT (lower(email)) DO NOTHING RETURNING id`,
        [invite.email, await hashPassword(body.password)]
      );
      if (!user.rows[0]) {
        await client.query('ROLLBACK');
        return reply.code(409).send({ error: 'Já existe uma conta com este e-mail.' });
      }
      const userId = user.rows[0].id;
      await client.query(`INSERT INTO user_roles(user_id,role_id) VALUES($1,$2)`, [userId, invite.roleId]);
      await client.query(
        `INSERT INTO staff_profiles(user_id,display_name,status,created_by)
         VALUES($1,$2,'SUSPENDED',$3)`, [userId, invite.displayName, invite.invitedBy ?? null]
      );
      await client.query(
        `UPDATE staff_invites SET status='ACCEPTED',accepted_by_user_id=$2,accepted_at=now(),updated_at=now()
         WHERE id=$1`, [invite.id, userId]
      );
      await audit(client, 'STAFF_INVITE_ACCEPTED_PENDING_ACTIVATION', 'staff_invite', {
        entityId:invite.id, metadata:{ userId, roleCode:invite.roleCode, active:false },
      });
      await client.query('COMMIT');
      return reply.code(201).send({
        data:{ inviteId:invite.id, userId, status:'PENDING_ACTIVATION' },
        message:'Convite confirmado. O acesso profissional continua inativo até a migração segura de perfis.',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  });

  await app.register(async protectedRoutes => {
    protectedRoutes.addHook('preHandler', app.requirePermission('staff:manage'));

    protectedRoutes.get('/', async () => {
    const [members, invites] = await Promise.all([
      app.db.query(`SELECT sp.id,sp.user_id AS "userId",sp.display_name AS "displayName",sp.status,
        u.email,u.active,COALESCE(array_agg(r.code ORDER BY r.code) FILTER (WHERE r.code IS NOT NULL),'{}') AS roles,
        sp.created_at AS "createdAt",sp.updated_at AS "updatedAt"
        FROM staff_profiles sp JOIN users u ON u.id=sp.user_id
        LEFT JOIN user_roles ur ON ur.user_id=u.id LEFT JOIN roles r ON r.id=ur.role_id
        GROUP BY sp.id,u.id ORDER BY sp.display_name,u.email`),
      app.db.query(`SELECT si.id,si.email,si.display_name AS "displayName",r.code AS "roleCode",
        CASE WHEN si.status='PENDING' AND si.expires_at<=now() THEN 'EXPIRED' ELSE si.status END AS status,
        si.expires_at AS "expiresAt",si.created_at AS "createdAt"
        FROM staff_invites si JOIN roles r ON r.id=si.role_id
        WHERE si.status='PENDING' ORDER BY si.created_at DESC`),
    ]);
    return { data: { members: members.rows, invites: invites.rows } };
  });

    protectedRoutes.post('/invites', async (request, reply) => {
    const body = inviteSchema.parse(request.body);
    const tokenHash = hashToken(createOpaqueToken());
    await app.db.query(
      `UPDATE staff_invites SET status='EXPIRED',updated_at=now()
       WHERE status='PENDING' AND expires_at<=now()`,
    );
    const result = await app.db.query<{id:string;email:string;displayName:string;roleCode:string;status:string;expiresAt:Date;createdAt:Date}>(
      `INSERT INTO staff_invites(email,display_name,role_id,token_hash,invited_by,expires_at)
       SELECT $1,$2,r.id,$4,$5,now()+($6::int*interval '1 hour') FROM roles r
       WHERE r.code=$3 AND NOT EXISTS(SELECT 1 FROM users u WHERE lower(u.email)=lower($1))
       RETURNING id,email,display_name AS "displayName",$3::text AS "roleCode",status,
         expires_at AS "expiresAt",created_at AS "createdAt"`,
      [body.email, body.displayName, body.roleCode, tokenHash, request.auth!.userId, body.expiresInHours]
    );
    const invite = result.rows[0];
    if (!invite) return reply.code(409).send({ error: 'Já existe uma conta com este e-mail ou o perfil informado não está disponível.' });
    await audit(app.db, 'STAFF_INVITE_PREPARED', 'staff_invite', {
      actorUserId: request.auth!.userId, entityId: invite.id,
      metadata: { emailHash: hashToken(body.email), roleCode: body.roleCode, expiresInHours: body.expiresInHours },
    });
    return reply.code(201).send({ data: invite, message: 'Convite preparado. Nenhum e-mail foi enviado.' });
  });

    protectedRoutes.delete('/invites/:id', async (request, reply) => {
    const { id } = idSchema.parse(request.params);
    const result = await app.db.query<{id:string}>(
      `UPDATE staff_invites SET status='CANCELLED',cancelled_at=now(),updated_at=now()
       WHERE id=$1 AND status='PENDING' AND expires_at>now() RETURNING id`, [id]
    );
    if (!result.rows[0]) return reply.code(404).send({ error: 'Convite pendente não encontrado.' });
    await audit(app.db, 'STAFF_INVITE_CANCELLED', 'staff_invite', {
      actorUserId: request.auth!.userId, entityId: id,
    });
    return reply.code(204).send();
  });
  });
}
