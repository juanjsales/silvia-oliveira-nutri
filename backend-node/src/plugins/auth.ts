import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { hashToken } from '../shared/crypto.js';

export async function authPlugin(app: FastifyInstance) {
  app.decorateRequest('auth', null);

  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies[app.env.SESSION_COOKIE_NAME];
    if (!token) return reply.code(401).send({ error: 'Sessão necessária.' });

    const result = await app.db.query<{
      session_id: string; user_id: string; role: 'ADMIN' | 'PATIENT'; patient_id: string | null;
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

  app.decorate('requireAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    await app.authenticate(request, reply);
    if (reply.sent) return;
    if (request.auth?.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Acesso restrito à administradora.' });
    }
  });
}
