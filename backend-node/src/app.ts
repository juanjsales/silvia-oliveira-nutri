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

export async function buildApp(env: AppEnv, db: Database) {
  const app = Fastify({ logger: { redact: ['req.headers.cookie', 'req.headers.authorization', 'body.password', 'body.token'] } });
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

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError || (typeof error === 'object' && error !== null && 'issues' in error && Array.isArray(error.issues))) {
      const details = typeof error === 'object' && error !== null && 'issues' in error ? error.issues : undefined;
      return reply.code(400).send({ error: 'Dados inválidos.', details });
    }
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') return reply.code(409).send({ error: 'Registro duplicado.' });
    app.log.error(error);return reply.code(500).send({ error: 'Erro interno do servidor.' });
  });

  app.get('/health', async () => {
    await db.query('SELECT 1');
    return { status: 'ok' };
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
  await app.register(portalRoutes, { prefix: '/api/portal' });
  await app.register(financeRoutes, { prefix: '/api/finance' });
  await app.register(documentRoutes, { prefix: '/api/documents' });
  await app.register(videoRoutes, { prefix: '/api/video' });

  return app;
}
