import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { schemaStatus } from '../../database/schema-version.js';
import { audit } from '../../shared/audit.js';
import { hashPassword, verifyPassword } from '../../shared/crypto.js';
import { capitalizePersonName } from '../../shared/formatters.js';

const optionalUrl = z.url().max(1000).optional();
const settingsSchema = z.object({
  clinicName: z.string().trim().min(2).max(160), professionalName: z.string().trim().min(2).max(160).transform(capitalizePersonName),
  crn: z.string().trim().min(2).max(60), specialty: z.string().trim().max(160), phone: z.string().trim().max(30).optional(),
  email: z.email().optional(), address: z.string().trim().max(300).optional(), city: z.string().trim().max(100).optional(),
  logoUrl: optionalUrl, portraitUrl: optionalUrl, fullBodyUrl: optionalUrl, consultationImageUrl: optionalUrl,
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/), secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  inPersonPrice: z.number().nonnegative(), onlinePrice: z.number().nonnegative(), defaultDurationMinutes: z.number().int().min(15).max(480),
  reminderMessage: z.string().trim().min(1).max(2000), followupMessage: z.string().trim().min(1).max(2000), documentFooter: z.string().trim().min(1).max(500),
});

const select = `SELECT clinic_name AS "clinicName",professional_name AS "professionalName",crn,specialty,phone,email,address,city,
  logo_url AS "logoUrl",portrait_url AS "portraitUrl",full_body_url AS "fullBodyUrl",consultation_image_url AS "consultationImageUrl",
  primary_color AS "primaryColor",secondary_color AS "secondaryColor",in_person_price::float8 AS "inPersonPrice",
  online_price::float8 AS "onlinePrice",default_duration_minutes AS "defaultDurationMinutes",reminder_message AS "reminderMessage",
  followup_message AS "followupMessage",document_footer AS "documentFooter",updated_at AS "updatedAt" FROM clinic_settings WHERE singleton=true`;

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAdmin);
  app.get('/', async () => ({ data: (await app.db.query(select)).rows[0] }));
  app.get('/readiness', async () => {
    const [schema, smtp] = await Promise.all([schemaStatus(app.db), app.db.query<{enabled:boolean;host:string|null;user:string|null;from:string|null;passwordConfigured:boolean}>(`SELECT smtp_enabled AS enabled,smtp_host AS host,smtp_user AS "user",smtp_from AS "from",smtp_password_encrypted IS NOT NULL AS "passwordConfigured" FROM clinic_settings WHERE singleton=true`)]);
    const stored = smtp.rows[0];
    const environmentEmail = Boolean(app.env.SMTP_HOST && app.env.SMTP_USER && app.env.SMTP_PASS);
    const configuredEmail = Boolean((stored?.enabled && stored.host && stored.user && stored.from && stored.passwordConfigured && app.env.APP_ENCRYPTION_KEY) || environmentEmail);
    const storageReady = Boolean(app.env.SUPABASE_URL && app.env.SUPABASE_SERVICE_ROLE_KEY && app.env.SUPABASE_EXAMS_BUCKET);
    const checks = [
      {key:'database',label:'Banco e migrações',ready:schema.ready,required:true,detail:schema.ready?'Estrutura do banco atualizada.':`Execute ${schema.requiredMigration}.`},
      {key:'email',label:'E-mails automáticos',ready:configuredEmail,required:true,detail:configuredEmail?'SMTP ativo e com credenciais protegidas.':'Configure e teste o SMTP abaixo.'},
      {key:'video',label:'Teleconsulta Nativa P2P',ready:true,required:true,detail:'WebRTC P2P nativo ativo e operacional.'},
      {key:'storage',label:'Exames privados',ready:storageReady,required:false,detail:storageReady?'Storage privado do Supabase configurado.':'Configure as variáveis do Storage para receber exames.'},
      {key:'encryption',label:'Proteção de segredos',ready:Boolean(app.env.APP_ENCRYPTION_KEY),required:true,detail:app.env.APP_ENCRYPTION_KEY?'Chave de criptografia configurada.':'Defina APP_ENCRYPTION_KEY na Vercel.'},
    ];
    return { data:{ ready:checks.filter(check=>check.required).every(check=>check.ready), checks } };
  });
  app.put('/', async request => {
    const b = settingsSchema.parse(request.body);
    await app.db.query(`UPDATE clinic_settings SET clinic_name=$1,professional_name=$2,crn=$3,specialty=$4,phone=$5,email=$6,address=$7,city=$8,logo_url=$9,portrait_url=$10,full_body_url=$11,consultation_image_url=$12,primary_color=$13,secondary_color=$14,in_person_price=$15,online_price=$16,default_duration_minutes=$17,reminder_message=$18,followup_message=$19,document_footer=$20,updated_by=$21,updated_at=now() WHERE singleton=true`, [b.clinicName,b.professionalName,b.crn,b.specialty,b.phone||null,b.email||null,b.address||null,b.city||null,b.logoUrl||null,b.portraitUrl||null,b.fullBodyUrl||null,b.consultationImageUrl||null,b.primaryColor,b.secondaryColor,b.inPersonPrice,b.onlinePrice,b.defaultDurationMinutes,b.reminderMessage,b.followupMessage,b.documentFooter,request.auth!.userId]);
    await audit(app.db,'CLINIC_SETTINGS_UPDATED','clinic_settings',{actorUserId:request.auth!.userId,entityId:'singleton'});
    return { data:(await app.db.query(select)).rows[0] };
  });
  app.post('/password', async (request, reply) => {
    const b = z.object({currentPassword:z.string().min(1),newPassword:z.string().min(12).max(128)}).parse(request.body);
    const user = await app.db.query<{password_hash:string}>('SELECT password_hash FROM users WHERE id=$1',[request.auth!.userId]);
    if (!user.rows[0] || !await verifyPassword(user.rows[0].password_hash,b.currentPassword)) return reply.code(400).send({error:'Senha atual incorreta.'});
    await app.db.query('UPDATE users SET password_hash=$1,updated_at=now() WHERE id=$2',[await hashPassword(b.newPassword),request.auth!.userId]);
    await app.db.query('UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND id<>$2 AND revoked_at IS NULL',[request.auth!.userId,request.auth!.sessionId]);
    await audit(app.db,'ADMIN_PASSWORD_CHANGED','user',{actorUserId:request.auth!.userId,entityId:request.auth!.userId});
    return {message:'Senha alterada com sucesso.'};
  });
}
