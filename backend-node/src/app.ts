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

export async function buildApp(env: AppEnv, db: Database) {
  const app = Fastify({ trustProxy:env.NODE_ENV==='production', logger: { redact: ['req.headers.cookie', 'req.headers.authorization', 'body.password', 'body.token'] } });
  app.decorate('env', env);
  app.decorate('db', db);
  await app.register(helmet);
  await app.register(cookie);
  await app.register(cors, { origin: env.FRONTEND_ORIGIN, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] });
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  // Authentication decorators must live on the root instance so sibling route
  // plugins can use them. Registering this function as a regular Fastify plugin
  // would encapsulate the decorators inside its own scope.
  await authPlugin(app);

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
      crn, specialty, phone, email, city, logo_url AS "logoUrl", primary_color AS "primaryColor",
      secondary_color AS "secondaryColor" FROM clinic_settings WHERE singleton=true`)).rows[0]
  }));
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

  return app;
}
