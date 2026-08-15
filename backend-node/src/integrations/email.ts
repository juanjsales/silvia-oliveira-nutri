import nodemailer from 'nodemailer';
import type { AppEnv } from '../config/env.js';
import type { Database } from '../database/pool.js';
import { loadSmtpConfig, smtpTransport } from './configured-email.js';

export function createMailer(env: AppEnv) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;
  return nodemailer.createTransport({ host:env.SMTP_HOST, port:env.SMTP_PORT, secure:env.SMTP_SECURE, auth:{ user:env.SMTP_USER, pass:env.SMTP_PASS } });
}

export async function sendPatientInvitationEmail(env:AppEnv,db:Database,input:{to:string;name:string;token:string}) {
  const config=await loadSmtpConfig(db,env);if(!config)return false;
  const link=`${env.APP_URL}/redefinir-senha?token=${encodeURIComponent(input.token)}`;
  await smtpTransport(config).sendMail({from:config.from,to:input.to,subject:'Ative seu acesso — Portal Nutricional',text:`Olá, ${input.name}.\n\nVocê recebeu acesso ao Portal Nutricional.\n\nPara escolher sua senha e ativar a conta, acesse este link temporário:\n${link}\n\nO link expira em ${env.PASSWORD_RESET_TTL_MINUTES} minutos. Se você não solicitou este acesso, ignore esta mensagem.`});return true;
}

export async function sendAppointmentEmail(env:AppEnv,db:Database,input:{to:string;name:string;date:string;time:string;type:string;durationMinutes:number}) {
  const config=await loadSmtpConfig(db,env);if(!config)return false;
  const date=new Date(`${input.date}T12:00:00`).toLocaleDateString('pt-BR');
  await smtpTransport(config).sendMail({from:config.from,to:input.to,subject:'Consulta nutricional agendada',text:`Olá, ${input.name}.\n\nSua consulta foi agendada.\n\nData: ${date}\nHorário: ${input.time}\nAtendimento: ${input.type}\nDuração prevista: ${input.durationMinutes} minutos\n\nAcesse ${env.APP_URL}/portal para acompanhar a consulta.`});return true;
}

export async function sendAppointmentReminderEmail(env:AppEnv,db:Database,input:{to:string;name:string;date:string;time:string;type:string;template?:string|null}) {
  const config=await loadSmtpConfig(db,env);if(!config)return false;
  const date=new Date(`${input.date}T12:00:00`).toLocaleDateString('pt-BR');
  const custom=input.template?.replaceAll('{NOME}',input.name).replaceAll('{DATA}',date).replaceAll('{HORA}',input.time);
  const text=custom||`Olá, ${input.name}.\n\nLembramos que sua consulta nutricional será amanhã.\n\nData: ${date}\nHorário: ${input.time}\nAtendimento: ${input.type}\n\nAcesse ${env.APP_URL}/portal para acompanhar os detalhes.`;
  await smtpTransport(config).sendMail({from:config.from,to:input.to,subject:'Lembrete da sua consulta nutricional',text});return true;
}
