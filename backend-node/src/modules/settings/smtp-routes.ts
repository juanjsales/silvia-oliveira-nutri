import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { audit } from '../../shared/audit.js';
import { encryptSecret } from '../../shared/secret.js';
import { loadSmtpConfig, smtpTransport } from '../../integrations/configured-email.js';
import { buildHtmlEmail } from '../../integrations/email.js';
import { loadClinicIdentity } from '../../shared/clinic-identity.js';

const smtpPutSchema = z.object({
  host: z.string().trim().min(2).max(255),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.boolean().default(false),
  user: z.string().trim().min(1).max(255),
  password: z.string().trim().min(1).max(500).optional(),
  from: z.string().trim().min(3).max(255),
  enabled: z.boolean().default(false)
});

export async function smtpSettingsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAdmin);

  app.get('/', async () => {
    const r = await app.db.query<any>(
      `SELECT smtp_host AS host, smtp_port AS port, smtp_secure AS secure,
              smtp_user AS "user", smtp_from AS "from", smtp_enabled AS enabled,
              (smtp_password_encrypted IS NOT NULL) AS "passwordConfigured"
       FROM clinic_settings WHERE singleton=true`
    );
    return { data: r.rows[0] };
  });

  app.put('/', async (request, reply) => {
    const b = smtpPutSchema.parse(request.body);

    if (b.password && !app.env.APP_ENCRYPTION_KEY) {
      return reply.code(409).send({ error: 'Defina APP_ENCRYPTION_KEY no ambiente antes de salvar a senha SMTP.' });
    }

    const current = await app.db.query<{ password: string | null }>(
      `SELECT smtp_password_encrypted AS password FROM clinic_settings WHERE singleton=true`
    );

    const cleanPassword = b.password ? b.password.replace(/\s+/g, '') : null;
    const password = cleanPassword
      ? encryptSecret(cleanPassword, app.env.APP_ENCRYPTION_KEY!)
      : current.rows[0]?.password;

    if (b.enabled && !password) {
      return reply.code(400).send({ error: 'Informe a senha de app do Gmail/SMTP antes de ativar o envio.' });
    }

    await app.db.query(
      `UPDATE clinic_settings
       SET smtp_host=$1, smtp_port=$2, smtp_secure=$3, smtp_user=$4,
           smtp_password_encrypted=$5, smtp_from=$6, smtp_enabled=$7,
           updated_at=now(), updated_by=$8
       WHERE singleton=true`,
      [b.host, b.port, b.secure, b.user, password || null, b.from, b.enabled, request.auth!.userId]
    );

    await audit(app.db, 'SMTP_SETTINGS_UPDATED', 'clinic_settings', {
      actorUserId: request.auth!.userId,
      entityId: 'singleton',
      metadata: { enabled: b.enabled, passwordChanged: Boolean(cleanPassword) }
    });

    return { message: 'Configuração SMTP salva com sucesso.' };
  });

  app.delete('/', async (request) => {
    await app.db.query(
      `UPDATE clinic_settings
       SET smtp_host=NULL, smtp_port=587, smtp_secure=false, smtp_user=NULL,
           smtp_password_encrypted=NULL, smtp_from=NULL, smtp_enabled=false,
           updated_at=now(), updated_by=$1
       WHERE singleton=true`,
      [request.auth!.userId]
    );

    await audit(app.db, 'SMTP_SETTINGS_REMOVED', 'clinic_settings', {
      actorUserId: request.auth!.userId,
      entityId: 'singleton'
    });

    return { message: 'Configurações de e-mail e credenciais removidas com sucesso.' };
  });

  app.post('/test', async (request, reply) => {
    const { to } = z.object({ to: z.string().trim().email() }).parse(request.body);
    const config = await loadSmtpConfig(app.db, app.env);

    if (!config) {
      return reply.code(409).send({ error: 'SMTP não configurado ou desativado. Salve as credenciais primeiro.' });
    }

    try {
      const identity = await loadClinicIdentity(app.db);
      const html = buildHtmlEmail({
        title: 'Serviço de E-mail Configurado com Sucesso',
        badge: 'Teste de Conexão',
        recipientName: identity.professionalName,
        lead: 'A integração SMTP do seu consultório nutricional está ativa e operando com sucesso.',
        details: [
          { label: 'Servidor Host', value: config.host },
          { label: 'Porta', value: String(config.port) },
          { label: 'Remetente', value: config.from },
          { label: 'Segurança', value: config.secure ? 'SSL/TLS (Porta 465)' : 'STARTTLS (Porta 587)' },
        ],
        footerNote: 'Todos os e-mails automáticos de confirmação de consulta, lembretes e liberação de acesso aos pacientes serão entregues a partir desta conta.',
        identity,
      });

      await smtpTransport(config).sendMail({
        from: config.from,
        to,
        subject: `Teste de e-mail — ${identity.clinicName}`,
        text: 'A configuração SMTP do consultório está funcionando perfeitamente! Os e-mails de agendamento e lembretes aos pacientes estão ativos.',
        html,
      });
      return { message: `E-mail de teste enviado com sucesso para ${to}.` };
    } catch (err: any) {
      app.log.error({ err }, 'Falha ao enviar e-mail de teste SMTP');
      return reply.code(502).send({
        error: err?.message || 'Falha ao autenticar no servidor SMTP. Verifique o e-mail e a senha de app.'
      });
    }
  });
}
