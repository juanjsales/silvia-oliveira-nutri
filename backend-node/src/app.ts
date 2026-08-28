import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import type { AppEnv } from './config/env.js';
import type { Database } from './database/pool.js';
import { authPlugin } from './plugins/auth.js';
import { authRoutes } from './modules/auth/routes.js';
import { patientRoutes } from './modules/patients/routes.js';
import { appointmentRoutes } from './modules/appointments/routes.js';
import { encounterRoutes } from './modules/encounters/routes.js';
import { nutritionRoutes } from './modules/nutrition/routes.js';
import { settingsRoutes } from './modules/settings/routes.js';
import { portalRoutes } from './modules/portal/routes.js';
import { financeRoutes } from './modules/finance/routes.js';
import { documentRoutes } from './modules/documents/routes.js';
import { videoRoutes } from './modules/video/routes.js';
import { smtpSettingsRoutes } from './modules/settings/smtp-routes.js';
import { schemaStatus } from './database/schema-version.js';
import { cronRoutes } from './modules/cron/routes.js';
import { monitoringRoutes } from './modules/monitoring/routes.js';
import { recordIncident } from './shared/incidents.js';
import { privacyRoutes } from './modules/privacy/routes.js';
import { patientAppointmentRoutes } from './modules/patient-appointments/routes.js';
import { emailDeliveryRoutes } from './modules/email-deliveries/routes.js';
import { clinicalCoreRoutes } from './modules/clinical-core/routes.js';
import { messageRoutes } from './modules/messages/routes.js';
import { followUpRoutes } from './modules/follow-up/routes.js';
import { notificationRoutes } from './modules/notifications/routes.js';
import { auditRoutes } from './modules/audit/routes.js';
import { PRIVACY_NOTICE_VERSION } from './shared/privacy-notice.js';
import { publicDataRoutes } from './modules/public-data/routes.js';
import { platformRoutes } from './modules/platform/routes.js';
import { vercelRoutes } from './modules/platform/vercel-routes.js';
import { previewRoutes, type PreviewSmokeRunner } from './modules/platform/preview-routes.js';
import { onboardingLifecycleRoutes } from './modules/platform/onboarding-lifecycle-routes.js';
import { disabledVercelProvider, type VercelProvider } from './integrations/vercel-provider.js';
import { VercelHttpProvider } from './integrations/vercel-http-provider.js';
import { staffRoutes } from './modules/staff/routes.js';
import { licenseRoutes } from './modules/license/routes.js';
import { isLicenseWriteExempt, loadLicenseState } from './modules/license/service.js';
import { audit } from './shared/audit.js';
import { supabaseRoutes } from './modules/platform/supabase-routes.js';
import { createGuidedSupabaseVerifier, type GuidedSupabaseVerifier } from './integrations/supabase-provider.js';

export async function buildApp(env: AppEnv, db: Database, integrations: { vercel?: VercelProvider; supabase?: GuidedSupabaseVerifier; previewSmoke?: PreviewSmokeRunner } = {}) {
  const app = Fastify({ trustProxy:env.NODE_ENV==='production', logger: { redact: ['req.headers.cookie', 'req.headers.authorization', 'body.password', 'body.token', 'body.joinToken'] } });
  app.decorate('env', env);
  app.decorate('db', db);
  const allowedOrigins = new Set([
    new URL(env.FRONTEND_ORIGIN).origin,
    new URL(env.APP_URL).origin,
    ...(env.VERCEL_URL ? [`https://${env.VERCEL_URL}`] : []),
    ...(env.LEGACY_APP_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean).map(value => new URL(value).origin),
  ]);
  await app.register(helmet);
  await app.register(cookie);
  await app.register(cors, {
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  app.addHook('onRequest', async (request, reply) => {
    if (!request.url.startsWith('/api/')) return;
    reply.header('Cache-Control', 'no-store');
    reply.header('Pragma', 'no-cache');
    if (env.NODE_ENV !== 'production' || !['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return;
    const origin = request.headers.origin;
    // Browser mutations must originate from the configured application. Requests
    // without Origin remain available to trusted server-to-server integrations.
    if (origin && !allowedOrigins.has(origin)) return reply.code(403).send({ error: 'Origem da solicitação não autorizada.' });
  });
  // Authentication decorators must live on the root instance so sibling route
  // plugins can use them. Registering this function as a regular Fastify plugin
  // would encapsulate the decorators inside its own scope.
  await authPlugin(app);
  app.addHook('preHandler',async(request,reply)=>{
    if(!request.url.startsWith('/api/')||!['POST','PUT','PATCH','DELETE'].includes(request.method)||isLicenseWriteExempt(request.method,request.url))return;
    const license=await loadLicenseState(db,env.LICENSE_PUBLIC_KEY,env.INSTALLATION_ID);
    if(license.permissions.includes('write'))return;
    try{await audit(db,'LICENSE_WRITE_BLOCKED','installation_license',{entityId:'singleton',metadata:{state:license.state,method:request.method,route:request.routeOptions.url||'unknown'}})}catch{app.log.error({requestId:request.id},'Falha ao auditar bloqueio de licença')}
    return reply.code(423).send({error:'Instalação em modo somente leitura. Consultas e exportação de dados continuam disponíveis.',code:'LICENSE_READ_ONLY',licenseState:license.state});
  });

  app.setErrorHandler(async (error, request, reply) => {
    if (error instanceof ZodError || (typeof error === 'object' && error !== null && 'issues' in error && Array.isArray(error.issues))) {
      const details = typeof error === 'object' && error !== null && 'issues' in error ? error.issues : undefined;
      return reply.code(400).send({ error: 'Dados inválidos.', details });
    }
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') return reply.code(409).send({ error: 'Registro duplicado.' });
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23P01') return reply.code(409).send({ error: 'Este horário conflita com outra consulta. Escolha um horário livre.' });
    if(typeof error==='object'&&error!==null&&'statusCode'in error&&error.statusCode===429){const retryAfter='retryAfter'in error?Number(error.retryAfter):900;reply.header('Retry-After',String(retryAfter));return reply.code(429).send({error:error instanceof Error?error.message:'Muitas tentativas. Tente novamente mais tarde.'})}
    const errorCode=typeof error==='object'&&error!==null&&'code'in error?String(error.code).slice(0,80):undefined;
    app.log.error({requestId:request.id,method:request.method,route:request.routeOptions.url,errorName:error instanceof Error?error.name:'UnknownError',errorCode},'Falha interna não tratada');
    try { await recordIncident(db,request,error); } catch { app.log.error({requestId:request.id},'Falha ao registrar incidente'); }
    return reply.code(500).send({ error: 'Erro interno do servidor.', requestId:request.id });
  });

  app.get('/health', async (_request, reply) => {
    await db.query('SELECT 1');
    const schema = await schemaStatus(db);
    if (!schema.ready) {
      return reply.code(503).send({ status: 'degraded', database: 'connected', schema });
    }
    return { status: 'ok', database: 'connected', schema };
  });
  app.get('/api/settings/public', async () => ({
    data: (await db.query(`SELECT clinic_name AS "clinicName", professional_name AS "professionalName",
      crn, specialty, phone, email, city, logo_url AS "logoUrl", portrait_url AS "portraitUrl",
      full_body_url AS "fullBodyUrl", consultation_image_url AS "consultationImageUrl", primary_color AS "primaryColor",
      secondary_color AS "secondaryColor" FROM clinic_settings WHERE singleton=true`)).rows[0]
  }));
  app.get('/api/privacy/public-notice', async () => {
    const settings = (await db.query<{
      clinicName:string; professionalName:string; controllerName:string|null; controllerDocument:string|null;
      privacyContactName:string|null; privacyContactEmail:string|null; email:string|null; updatedAt:Date|null;
    }>(`SELECT clinic_name AS "clinicName",professional_name AS "professionalName",
      privacy_controller_name AS "controllerName",privacy_controller_document AS "controllerDocument",
      privacy_contact_name AS "privacyContactName",privacy_contact_email AS "privacyContactEmail",
      email,privacy_notice_updated_at AS "updatedAt" FROM clinic_settings WHERE singleton=true`)).rows[0];
    return { data: {
      version: PRIVACY_NOTICE_VERSION,
      controller: { name: settings?.controllerName || settings?.clinicName, document: settings?.controllerDocument || null },
      privacyContact: { name: settings?.privacyContactName || settings?.professionalName, email: settings?.privacyContactEmail || settings?.email || null },
      updatedAt: settings?.updatedAt || null,
      purposes: ['Prestar atendimento nutricional e manter o prontuário','Gerenciar consultas, comunicações e documentos','Cumprir obrigações profissionais, legais e de segurança'],
      categories: ['Dados cadastrais e de contato','Dados de saúde e histórico clínico','Registros de atendimento, documentos e comunicações','Dados técnicos de acesso e segurança'],
      rights: ['Confirmar e acessar dados','Solicitar correção','Solicitar portabilidade ou informação sobre compartilhamentos','Solicitar análise de anonimização, bloqueio ou eliminação quando aplicável','Revogar consentimentos específicos, sem afetar tratamentos apoiados em outra base'],
      retention: 'Os dados são mantidos somente pelo período necessário às finalidades e obrigações aplicáveis. Prontuários não são apagados automaticamente: pedidos de eliminação passam por análise para preservar obrigações profissionais e direitos.',
      security: 'O acesso é autenticado e restrito por perfil. Eventos relevantes são registrados para segurança e prestação de contas.',
      sharing: 'Dados podem ser processados por fornecedores essenciais de infraestrutura, armazenamento e e-mail, sob controles contratuais e de segurança. Não são comercializados.',
      channels: 'O paciente autenticado pode baixar seus dados e registrar solicitações na área Privacidade e meus dados.'
    }};
  });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(patientRoutes, { prefix: '/api/patients' });
  await app.register(appointmentRoutes, { prefix: '/api/appointments' });
  await app.register(encounterRoutes, { prefix: '/api/encounters' });
  await app.register(nutritionRoutes, { prefix: '/api/nutrition' });
  await app.register(settingsRoutes, { prefix: '/api/settings' });
  await app.register(smtpSettingsRoutes, { prefix: '/api/settings/smtp' });
  await app.register(portalRoutes, { prefix: '/api/portal' });
  await app.register(financeRoutes, { prefix: '/api/finance' });
  await app.register(documentRoutes, { prefix: '/api/documents' });
  await app.register(videoRoutes, { prefix: '/api/video' });
  await app.register(cronRoutes, { prefix: '/api/cron' });
  await app.register(monitoringRoutes, { prefix: '/api/monitoring' });
  await app.register(privacyRoutes, { prefix: '/api/privacy' });
  await app.register(patientAppointmentRoutes, { prefix: '/api/portal/appointments' });
  await app.register(emailDeliveryRoutes, { prefix: '/api/email-deliveries' });
  await app.register(clinicalCoreRoutes, { prefix: '/api/clinical' });
  await app.register(messageRoutes, { prefix: '/api/messages' });
  await app.register(followUpRoutes, { prefix: '/api/follow-up' });
  await app.register(notificationRoutes, { prefix: '/api/notifications' });
  await app.register(auditRoutes, { prefix: '/api/audit' });
  await app.register(publicDataRoutes, { prefix: '/api/public-data' });
  // Explicit false is the production tenant boundary. Undefined remains enabled
  // only for legacy in-process fixtures that construct AppEnv without loadEnv().
  if (env.CONTROL_PLANE_ENABLED !== false) {
    await app.register(platformRoutes, { prefix: '/api/platform' });
    const configuredVercel=env.VERCEL_OAUTH_CLIENT_ID&&env.VERCEL_OAUTH_CLIENT_SECRET&&env.VERCEL_OAUTH_REDIRECT_URI&&env.VERCEL_INTEGRATION_SLUG?new VercelHttpProvider({clientId:env.VERCEL_OAUTH_CLIENT_ID,clientSecret:env.VERCEL_OAUTH_CLIENT_SECRET,redirectUri:env.VERCEL_OAUTH_REDIRECT_URI,integrationSlug:env.VERCEL_INTEGRATION_SLUG}):disabledVercelProvider;
    await app.register(async scoped=>vercelRoutes(scoped,integrations.vercel??configuredVercel),{prefix:'/api/platform/vercel'});
    await app.register(async scoped=>previewRoutes(scoped,integrations.vercel??configuredVercel,integrations.previewSmoke),{prefix:'/api/platform/vercel'});
    await app.register(async scoped=>onboardingLifecycleRoutes(scoped,integrations.vercel??configuredVercel),{prefix:'/api/platform'});
    await app.register(async scoped=>supabaseRoutes(scoped,integrations.supabase??createGuidedSupabaseVerifier()),{prefix:'/api/platform/supabase'});
  }
  await app.register(staffRoutes, { prefix: '/api/staff' });
  await app.register(licenseRoutes, { prefix: '/api/license' });

  return app;
}
