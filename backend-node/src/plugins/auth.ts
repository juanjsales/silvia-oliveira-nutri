import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { hashToken } from '../shared/crypto.js';

function isMissingRbacSchema(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '42P01';
}

export async function authPlugin(app: FastifyInstance) {
  app.decorateRequest('auth', null);

  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies[app.env.SESSION_COOKIE_NAME];
    if (!token) return reply.code(401).send({ error: 'Sessão necessária.' });

    const result = await app.db.query<{
      session_id: string; user_id: string; role: 'ADMIN' | 'PATIENT' | 'NUTRITIONIST' | 'RECEPTIONIST'; patient_id: string | null;
    }>(
      `SELECT s.id AS session_id, u.id AS user_id, u.role, p.id AS patient_id
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN patients p ON p.user_id = u.id
       WHERE s.token_hash = $1 AND s.revoked_at IS NULL
         AND s.expires_at > now() AND u.active = true`,
      [hashToken(token)]
    );
    const session = result.rows[0];
    if (!session) {
      reply.clearCookie(app.env.SESSION_COOKIE_NAME, { path: '/' });
      return reply.code(401).send({ error: 'Sessão inválida ou expirada.' });
    }
    request.auth = {
      sessionId: session.session_id,
      userId: session.user_id,
      role: session.role,
      patientId: session.patient_id
    };
    // Keep an operational trail without writing on every request.
    await app.db.query(
      `UPDATE sessions SET last_seen_at=now()
       WHERE id=$1 AND last_seen_at < now() - interval '5 minutes'`,
      [session.session_id]
    );
  });

  app.decorate('hasPermission', async (request: FastifyRequest, permission: string) => {
    if (!request.auth) return false;

    // Existing installations keep working while RBAC is rolled out. ADMIN is
    // the legacy equivalent of CLINIC_OWNER and deliberately bypasses the new
    // tables; PATIENT access continues to be governed by the portal routes.
    if (request.auth.role === 'ADMIN') return true;
    if (request.auth.role === 'PATIENT') return false;

    try {
      const result = await app.db.query<{ allowed: boolean }>(
        `SELECT EXISTS (
           SELECT 1
           FROM user_roles ur
           JOIN roles r ON r.id = ur.role_id
           JOIN role_permissions rp ON rp.role_id = r.id
           JOIN permissions p ON p.id = rp.permission_id
           WHERE ur.user_id = $1 AND p.code = $2
         ) AS allowed`,
        [request.auth.userId, permission]
      );
      return result.rows[0]?.allowed === true;
    } catch (error) {
      // A deployment may briefly run the new application before its additive
      // RBAC migration. Fail closed for new roles without breaking legacy ADMIN.
      if (isMissingRbacSchema(error)) return false;
      throw error;
    }
  });

  app.decorate('requirePermission', (permission: string) => async (request: FastifyRequest, reply: FastifyReply) => {
    await app.authenticate(request, reply);
    if (reply.sent) return;
    if (!await app.hasPermission(request, permission)) {
      return reply.code(403).send({ error: 'Você não possui permissão para esta ação.' });
    }
  });

  app.decorate('hasExplicitPermission', async (request: FastifyRequest, permission: string) => {
    if (!request.auth) return false;
    try { const result=await app.db.query<{allowed:boolean}>(`SELECT EXISTS(SELECT 1 FROM user_roles ur JOIN role_permissions rp ON rp.role_id=ur.role_id JOIN permissions p ON p.id=rp.permission_id WHERE ur.user_id=$1 AND p.code=$2) AS allowed`,[request.auth.userId,permission]);return result.rows[0]?.allowed===true; }
    catch(error){if(isMissingRbacSchema(error))return false;throw error;}
  });
  app.decorate('requireExplicitPermission',(permission:string)=>async(request:FastifyRequest,reply:FastifyReply)=>{await app.authenticate(request,reply);if(reply.sent)return;if(!await app.hasExplicitPermission(request,permission))return reply.code(403).send({error:'Você não possui permissão explícita para esta ação.'})});

  app.decorate('requireAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    await app.authenticate(request, reply);
    if (reply.sent) return;
    if (request.auth?.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Acesso restrito à administradora.' });
    }
  });
}
