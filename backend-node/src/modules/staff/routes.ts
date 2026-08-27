import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createOpaqueToken, hashToken } from '../../shared/crypto.js';
import { audit } from '../../shared/audit.js';

const inviteSchema = z.object({
  email: z.string().trim().max(254).pipe(z.email()).transform(value => value.toLowerCase()),
  displayName: z.string().trim().min(2).max(160),
  roleCode: z.enum(['NUTRITIONIST', 'RECEPTIONIST']),
  expiresInHours: z.number().int().min(1).max(168).default(48),
}).strict();

const idSchema = z.object({ id: z.uuid() }).strict();

export async function staffRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requirePermission('staff:manage'));

  app.get('/', async () => {
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

  app.post('/invites', async (request, reply) => {
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

  app.delete('/invites/:id', async (request, reply) => {
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
}
