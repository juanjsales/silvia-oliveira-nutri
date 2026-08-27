import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { audit } from '../../shared/audit.js';
import { createOpaqueToken, hashPassword, hashToken, verifyPassword } from '../../shared/crypto.js';
import { loadSmtpConfig, smtpTransport } from '../../integrations/configured-email.js';
import { buildHtmlEmail } from '../../integrations/email.js';
import { assertLoginAllowed, clearLoginFailures, recordLoginFailure } from '../../shared/login-rate-limit.js';
import { loadClinicIdentity } from '../../shared/clinic-identity.js';

const loginSchema = z.object({ identifier: z.string().trim().min(3), password: z.string().min(1) });
const recoverySchema = z.object({ identifier: z.string().trim().min(3) });
const resetSchema = z.object({ token: z.string().min(20), password: z.string().min(12).max(128) });

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const identifier = body.identifier.toLowerCase();
    await assertLoginAllowed(app.db,identifier,request.ip);
    const cpf = identifier.replace(/\D/g, '');
    const result = await app.db.query<{ id: string; email: string; password_hash: string; role: 'ADMIN' | 'PATIENT'; name: string | null }>(
      `SELECT u.id, u.email, u.password_hash, u.role, p.name
       FROM users u LEFT JOIN patients p ON p.user_id = u.id
       WHERE u.active = true AND (u.email = $1 OR p.cpf = $2) LIMIT 1`,
      [identifier, cpf.length === 11 ? cpf : null]
    );
    const user = result.rows[0];
    if (!user || !(await verifyPassword(user.password_hash, body.password))) {
      await recordLoginFailure(app.db,identifier,request.ip);
      await audit(app.db, 'AUTH_LOGIN_FAILED', 'user', { metadata: { identifierHash: hashToken(identifier) } });
      return reply.code(401).send({ error: 'Credenciais inválidas.' });
    }
    await clearLoginFailures(app.db,identifier,request.ip);

    const token = createOpaqueToken();
    const expiresAt = new Date(Date.now() + app.env.SESSION_TTL_HOURS * 3_600_000);
    await app.db.query(
      `INSERT INTO sessions(user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [user.id, hashToken(token), expiresAt]
    );
    // Bound active sessions per account. The newest five remain valid.
    await app.db.query(
      `UPDATE sessions SET revoked_at=now()
       WHERE user_id=$1 AND revoked_at IS NULL AND id NOT IN (
         SELECT id FROM sessions WHERE user_id=$1 AND revoked_at IS NULL
         ORDER BY created_at DESC LIMIT 5
       )`,
      [user.id]
    );
    await audit(app.db, 'AUTH_LOGIN_SUCCEEDED', 'user', { actorUserId: user.id, entityId: user.id });
    reply.setCookie(app.env.SESSION_COOKIE_NAME, token, {
      path: '/', httpOnly: true, secure: app.env.NODE_ENV === 'production', sameSite: 'lax', expires: expiresAt
    });
    return { user: { id: user.id, email: user.email, role: user.role, name: user.name } };
  });

  app.post('/logout', { preHandler: app.authenticate }, async (request, reply) => {
    const token = request.cookies[app.env.SESSION_COOKIE_NAME];
    if (token) await app.db.query('UPDATE sessions SET revoked_at = now() WHERE token_hash = $1', [hashToken(token)]);
    await audit(app.db, 'AUTH_LOGOUT', 'user', { actorUserId: request.auth!.userId, entityId: request.auth!.userId });
    reply.clearCookie(app.env.SESSION_COOKIE_NAME, { path: '/' });
    return reply.code(204).send();
  });

  app.get('/me', { preHandler: app.authenticate }, async request => ({ user: request.auth }));

  app.post('/password-recovery', { config: { rateLimit: { max: 3, timeWindow: '1 hour' } } }, async request => {
    const { identifier } = recoverySchema.parse(request.body);
    const normalized = identifier.trim().toLowerCase();
    const cpf = normalized.replace(/\D/g, '');
    const result = await app.db.query<{ id: string; email: string; name: string | null }>(
      `SELECT u.id, u.email, p.name FROM users u LEFT JOIN patients p ON p.user_id = u.id
       WHERE u.active = true AND (u.email = $1 OR p.cpf = $2) LIMIT 1`,
      [normalized, cpf.length === 11 ? cpf : null]
    );
    const user = result.rows[0];
    if (user) {
      const smtp = await loadSmtpConfig(app.db, app.env);
      if (!smtp) throw new Error('Serviço de e-mail não configurado.');
      const mailer = smtpTransport(smtp);
      const rawToken = createOpaqueToken();
      const resetLink = `${app.env.APP_URL}/redefinir-senha?token=${encodeURIComponent(rawToken)}`;
      const expiresAt = new Date(Date.now() + app.env.PASSWORD_RESET_TTL_MINUTES * 60_000);
      const tokenHash = hashToken(rawToken);
      const identity = await loadClinicIdentity(app.db);

      const html = buildHtmlEmail({
        title: 'Redefinição de Senha',
        badge: 'Segurança',
        recipientName: user.name || 'Paciente',
        lead: 'Recebemos uma solicitação para redefinir a senha de acesso à sua conta no Portal Nutricional.',
        ctaText: 'Criar Nova Senha',
        ctaUrl: resetLink,
        footerNote: `Este link é temporário e expira em ${app.env.PASSWORD_RESET_TTL_MINUTES} minutos. Se você não realizou esta solicitação, desconsidere este e-mail.`,
        identity,
      });

      await app.db.query('DELETE FROM password_reset_tokens WHERE user_id = $1 AND used_at IS NULL', [user.id]);
      await app.db.query(
        'INSERT INTO password_reset_tokens(user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [user.id, tokenHash, expiresAt]
      );
      try {
        await mailer.sendMail({
          from: smtp.from,
          to: user.email,
          subject: `Redefinição de senha — ${identity.clinicName}`,
          text: `Defina uma nova senha acessando: ${resetLink}\n\nO link expira em ${app.env.PASSWORD_RESET_TTL_MINUTES} minutos.`,
          html,
        });
      } catch (error) {
        try {
          await app.db.query('DELETE FROM password_reset_tokens WHERE user_id = $1 AND token_hash = $2', [user.id, tokenHash]);
        } catch (cleanupError) {
          app.log.error({ cleanupError, userId: user.id }, 'Falha ao remover token de recuperação cujo e-mail não foi enviado');
        }
        throw error;
      }
      await audit(app.db, 'PASSWORD_RECOVERY_SENT', 'user', { entityId: user.id });
    }
    return { message: 'Se a conta existir, enviaremos as instruções de recuperação.' };
  });

  app.post('/password-reset', async (request, reply) => {
    const body = resetSchema.parse(request.body);
    const client = await app.db.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<{ id: string; user_id: string }>(
        `SELECT id, user_id FROM password_reset_tokens
         WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now() FOR UPDATE`,
        [hashToken(body.token)]
      );
      const reset = result.rows[0];
      if (!reset) {
        await client.query('ROLLBACK');
        return reply.code(400).send({ error: 'Link inválido ou expirado.' });
      }
      await client.query('UPDATE users SET password_hash = $1, active=true, updated_at = now() WHERE id = $2', [await hashPassword(body.password), reset.user_id]);
      await client.query('UPDATE password_reset_tokens SET used_at = now() WHERE id = $1', [reset.id]);
      await client.query('UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [reset.user_id]);
      await client.query('COMMIT');
      await audit(app.db, 'PASSWORD_RESET_COMPLETED', 'user', { entityId: reset.user_id });
      return { message: 'Senha redefinida. Faça login novamente.' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  });

  app.post('/password-change', { preHandler: app.authenticate }, async (request, reply) => {
    const body=z.object({currentPassword:z.string().min(1),newPassword:z.string().min(12).max(128)}).parse(request.body);
    const result=await app.db.query<{password_hash:string}>('SELECT password_hash FROM users WHERE id=$1 AND active=true',[request.auth!.userId]);
    if(!result.rows[0]||!(await verifyPassword(result.rows[0].password_hash,body.currentPassword)))return reply.code(400).send({error:'Senha atual incorreta.'});
    await app.db.query('UPDATE users SET password_hash=$1,updated_at=now() WHERE id=$2',[await hashPassword(body.newPassword),request.auth!.userId]);
    await app.db.query('UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND id<>$2 AND revoked_at IS NULL',[request.auth!.userId,request.auth!.sessionId]);
    await audit(app.db,'PASSWORD_CHANGED','user',{actorUserId:request.auth!.userId,entityId:request.auth!.userId});return{message:'Senha alterada com sucesso.'};
  });
}
