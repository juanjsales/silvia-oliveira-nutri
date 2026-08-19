import nodemailer from 'nodemailer';
import type { AppEnv } from '../config/env.js';
import type { Database } from '../database/pool.js';
import { loadSmtpConfig, smtpTransport } from './configured-email.js';

export function createMailer(env: AppEnv) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

export function buildHtmlEmail(options: {
  title: string;
  badge?: string;
  recipientName?: string;
  lead: string;
  details?: Array<{ label: string; value: string }>;
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
}) {
  const detailsHtml =
    options.details && options.details.length > 0
      ? `
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:20px 0;background-color:#f7faf8;border:1px solid #dce8df;border-radius:12px;overflow:hidden;">
        ${options.details
          .map(
            (d, idx) => `
          <tr style="${idx > 0 ? 'border-top:1px solid #e8efe9;' : ''}">
            <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#556b5e;width:35%;">${d.label}</td>
            <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#183b2b;">${d.value}</td>
          </tr>
        `,
          )
          .join('')}
      </table>
    `
      : '';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f6f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#20352b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f3f6f3;padding:32px 12px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(24,59,43,0.07);border:1px solid #dfe6e0;">
          <!-- Cabeçalho Timbrado -->
          <tr>
            <td style="background:linear-gradient(135deg,#183b2b 0%,#26533c 100%);padding:30px 32px;text-align:left;">
              <div style="font-size:10px;font-weight:800;letter-spacing:1.8px;color:#a5d4b5;text-transform:uppercase;margin-bottom:4px;">CONSULTÓRIO NUTRICIONAL</div>
              <div style="font-size:21px;font-weight:700;color:#ffffff;font-family:Georgia,serif;letter-spacing:-0.2px;">Dra. Silvia Oliveira Lemos</div>
              <div style="font-size:12px;color:#cce3d3;margin-top:2px;">Nutricionista Clínica & Funcional</div>
            </td>
          </tr>

          <!-- Conteúdo Principal -->
          <tr>
            <td style="padding:32px 32px 24px;">
              ${options.badge ? `<div style="display:inline-block;background-color:#e6f3e8;color:#236139;font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px;margin-bottom:14px;text-transform:uppercase;letter-spacing:0.5px;">${options.badge}</div>` : ''}
              
              <h1 style="margin:0 0 14px;font-size:19px;font-weight:700;color:#183b2b;font-family:Georgia,serif;">${options.title}</h1>
              
              ${options.recipientName ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#2c3d33;">Olá, <strong>${options.recipientName}</strong>,</p>` : ''}
              
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#495c50;">${options.lead}</p>

              ${detailsHtml}

              ${
                options.ctaUrl && options.ctaText
                  ? `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:26px 0 16px;">
                <tr>
                  <td align="center">
                    <a href="${options.ctaUrl}" target="_blank" style="display:inline-block;background-color:#183b2b;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 28px;border-radius:10px;box-shadow:0 3px 10px rgba(24,59,43,0.22);">
                      ${options.ctaText} &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              `
                  : ''
              }

              ${options.footerNote ? `<p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:#788b80;border-top:1px solid #edf2ee;padding-top:14px;">${options.footerNote}</p>` : ''}
            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td style="background-color:#f9fbf9;padding:18px 32px;border-top:1px solid #ebf1ec;text-align:center;">
              <p style="margin:0;font-size:11px;color:#7e8f85;">Consultório Dra. Silvia Oliveira Lemos · Nutrição e Saúde</p>
              <p style="margin:3px 0 0;font-size:11px;color:#9cb0a4;">Para dúvidas ou remarcações, entre em contato pelo portal ou WhatsApp.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendPatientInvitationEmail(
  env: AppEnv,
  db: Database,
  input: { to: string; name: string; token: string },
) {
  const config = await loadSmtpConfig(db, env);
  if (!config) return false;
  const link = `${env.APP_URL}/redefinir-senha?token=${encodeURIComponent(input.token)}`;

  const html = buildHtmlEmail({
    title: 'Seu acesso ao Portal Nutricional foi liberado',
    badge: 'Novo Acesso',
    recipientName: input.name,
    lead: 'Você recebeu acesso exclusivo ao seu Portal Nutricional para acompanhar plano alimentar, evolução, diário e teleconsultas.',
    ctaText: 'Criar Minha Senha & Entrar',
    ctaUrl: link,
    footerNote: `Este link de segurança é individual e expira em ${env.PASSWORD_RESET_TTL_MINUTES} minutos. Se não solicitou, por favor desconsidere.`,
  });

  const text = `Olá, ${input.name}.\n\nVocê recebeu acesso ao Portal Nutricional da Dra. Silvia Oliveira Lemos.\n\nPara escolher sua senha e ativar sua conta, acesse:\n${link}\n\nO link expira em ${env.PASSWORD_RESET_TTL_MINUTES} minutos.`;

  await smtpTransport(config).sendMail({
    from: config.from,
    to: input.to,
    subject: 'Ative seu acesso — Portal Nutricional Dra. Silvia Oliveira',
    text,
    html,
  });
  return true;
}

export async function sendAppointmentEmail(
  env: AppEnv,
  db: Database,
  input: { to: string; name: string; date: string; time: string; type: string; durationMinutes: number },
) {
  const config = await loadSmtpConfig(db, env);
  if (!config) return false;
  const date = new Date(`${input.date}T12:00:00`).toLocaleDateString('pt-BR');

  const html = buildHtmlEmail({
    title: 'Consulta Nutricional Confirmada',
    badge: 'Agendamento',
    recipientName: input.name,
    lead: 'Sua consulta nutricional foi agendada no consultório da Dra. Silvia Oliveira Lemos.',
    details: [
      { label: 'Data', value: date },
      { label: 'Horário', value: input.time },
      { label: 'Atendimento', value: input.type },
      { label: 'Duração', value: `${input.durationMinutes} minutos` },
    ],
    ctaText: 'Acessar Meu Portal',
    ctaUrl: `${env.APP_URL}/portal`,
    footerNote: 'Recomendamos acessar seu portal com antecedência para preencher o pré-checkin e anexar exames recentes.',
  });

  const text = `Olá, ${input.name}.\n\nSua consulta nutricional foi agendada.\n\nData: ${date}\nHorário: ${input.time}\nAtendimento: ${input.type}\nDuração: ${input.durationMinutes} min\n\nAcesse ${env.APP_URL}/portal para acompanhar.`;

  await smtpTransport(config).sendMail({
    from: config.from,
    to: input.to,
    subject: 'Consulta nutricional agendada — Dra. Silvia Oliveira',
    text,
    html,
  });
  return true;
}

export async function sendAppointmentUpdateEmail(
  env: AppEnv,
  db: Database,
  input: { to: string; name: string; date: string; time: string; type: string; cancelled: boolean },
) {
  const config = await loadSmtpConfig(db, env);
  if (!config) return false;
  const date = new Date(`${input.date}T12:00:00`).toLocaleDateString('pt-BR');
  const subject = input.cancelled
    ? 'Consulta nutricional cancelada — Dra. Silvia Oliveira'
    : 'Novo horário da sua consulta nutricional — Dra. Silvia Oliveira';

  const html = buildHtmlEmail({
    title: input.cancelled ? 'Consulta Cancelada' : 'Consulta Reagendada',
    badge: input.cancelled ? 'Cancelamento' : 'Reagendamento',
    recipientName: input.name,
    lead: input.cancelled
      ? `Informamos que a consulta agendada para ${date} às ${input.time} foi cancelada.`
      : 'Sua consulta nutricional teve a data ou horário atualizados conforme os detalhes abaixo:',
    details: input.cancelled
      ? [
          { label: 'Data Anterior', value: date },
          { label: 'Horário', value: input.time },
          { label: 'Status', value: 'Cancelado' },
        ]
      : [
          { label: 'Nova Data', value: date },
          { label: 'Novo Horário', value: input.time },
          { label: 'Modalidade', value: input.type },
        ],
    ctaText: 'Ver Minhas Consultas no Portal',
    ctaUrl: `${env.APP_URL}/portal`,
  });

  const details = input.cancelled
    ? `A consulta de ${date} às ${input.time} foi cancelada pelo consultório.`
    : `Sua consulta foi reagendada.\n\nNova data: ${date}\nNovo horário: ${input.time}\nAtendimento: ${input.type}`;

  const text = `Olá, ${input.name}.\n\n${details}\n\nAcesse ${env.APP_URL}/portal para acompanhar.`;

  await smtpTransport(config).sendMail({
    from: config.from,
    to: input.to,
    subject,
    text,
    html,
  });
  return true;
}

export async function sendAppointmentReminderEmail(
  env: AppEnv,
  db: Database,
  input: { to: string; name: string; date: string; time: string; type: string; template?: string | null },
) {
  const config = await loadSmtpConfig(db, env);
  if (!config) return false;
  const date = new Date(`${input.date}T12:00:00`).toLocaleDateString('pt-BR');

  const html = buildHtmlEmail({
    title: 'Lembrete da Sua Consulta Nutricional',
    badge: 'Lembrete',
    recipientName: input.name,
    lead: 'Lembramos que sua consulta nutricional está confirmada para amanhã. Confira os detalhes abaixo:',
    details: [
      { label: 'Data', value: date },
      { label: 'Horário', value: input.time },
      { label: 'Atendimento', value: input.type },
    ],
    ctaText: 'Acessar Portal do Paciente',
    ctaUrl: `${env.APP_URL}/portal`,
    footerNote: 'Em caso de imprevisto ou necessidade de reagendamento, avise-nos com antecedência.',
  });

  const custom = input.template
    ?.replaceAll('{NOME}', input.name)
    .replaceAll('{DATA}', date)
    .replaceAll('{HORA}', input.time);
  const text =
    custom ||
    `Olá, ${input.name}.\n\nLembramos que sua consulta nutricional será amanhã.\n\nData: ${date}\nHorário: ${input.time}\nAtendimento: ${input.type}\n\nAcesse ${env.APP_URL}/portal para acompanhar os detalhes.`;

  await smtpTransport(config).sendMail({
    from: config.from,
    to: input.to,
    subject: 'Lembrete da sua consulta nutricional — Dra. Silvia Oliveira',
    text,
    html,
  });
  return true;
}

