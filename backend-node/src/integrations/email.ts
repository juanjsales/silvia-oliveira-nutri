import nodemailer from 'nodemailer';
import type { AppEnv } from '../config/env.js';

export function createMailer(env: AppEnv) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
  });
}

export async function sendPatientAccessEmail(env:AppEnv,input:{to:string;name:string;temporaryPassword:string}){
  const mailer=createMailer(env);if(!mailer)return false;
  await mailer.sendMail({from:env.SMTP_FROM,to:input.to,subject:'Seu acesso ao Portal Nutricional',text:`Olá, ${input.name}.\n\nSeu acesso ao Portal Nutricional foi criado.\n\nEndereço: ${env.APP_URL}/login\nLogin: ${input.to}\nSenha temporária: ${input.temporaryPassword}\n\nApós entrar, altere sua senha em Segurança da conta.\n\nSe você não esperava esta mensagem, entre em contato com o consultório.`});return true;
}

export async function sendAppointmentEmail(env:AppEnv,input:{to:string;name:string;date:string;time:string;type:string;durationMinutes:number}){
  const mailer=createMailer(env);if(!mailer)return false;const date=new Date(`${input.date}T12:00:00`).toLocaleDateString('pt-BR');
  await mailer.sendMail({from:env.SMTP_FROM,to:input.to,subject:'Consulta nutricional agendada',text:`Olá, ${input.name}.\n\nSua consulta foi agendada.\n\nData: ${date}\nHorário: ${input.time}\nAtendimento: ${input.type}\nDuração prevista: ${input.durationMinutes} minutos\n\nAcesse ${env.APP_URL}/portal para acompanhar a consulta. O acesso à videochamada será liberado próximo ao horário agendado.`});return true;
}
