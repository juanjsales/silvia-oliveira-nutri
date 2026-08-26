import { loadEnvFile } from 'node:process';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('127.0.0.1'),
  DATABASE_URL: z.string().min(1),
  MIGRATION_DATABASE_URL: z.string().min(1).optional(),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(10).default(2),
  DB_CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(10000),
  DB_IDLE_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(10000),
  FRONTEND_ORIGIN: z.string().url(),
  LEGACY_APP_ORIGINS: z.string().optional(),
  SESSION_COOKIE_NAME: z.string().min(1).default('nutri_session'),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().max(168).default(6),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().max(120).default(30),
  APP_URL: z.string().url(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  SUPABASE_EXAMS_BUCKET: z.string().min(2).optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.preprocess(v => v === true || v === 'true', z.boolean()).default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().min(1),
  APP_ENCRYPTION_KEY: z.string().min(32).optional(),
  CRON_SECRET: z.string().min(32).optional(),
  WEBRTC_STUN_URLS: z.string().min(1).optional(),
  WEBRTC_TURN_URL: z.string().regex(/^turns?:/).optional(),
  WEBRTC_TURN_USERNAME: z.string().min(1).optional(),
  WEBRTC_TURN_CREDENTIAL: z.string().min(12).optional(),
  WEBRTC_SIGNALING_HOST: z.string().min(1).optional(),
  WEBRTC_SIGNALING_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  WEBRTC_SIGNALING_PATH: z.string().regex(/^\//).optional(),
  WEBRTC_SIGNALING_SECURE: z.union([z.boolean(), z.enum(['true', 'false']).transform(value => value === 'true')]).optional(),
  VAPID_PUBLIC_KEY: z.string().min(40).optional(),
  VAPID_PRIVATE_KEY: z.string().min(20).optional(),
  VAPID_SUBJECT: z.string().regex(/^(mailto:|https:)/).optional()
}).superRefine((env, context) => {
  for (const [index, value] of (env.LEGACY_APP_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean).entries()) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash) throw new Error();
    } catch {
      context.addIssue({ code: 'custom', path: ['LEGACY_APP_ORIGINS', index], message: 'Cada origem legada deve ser uma origem HTTPS sem caminho.' });
    }
  }
  const turnValues = [env.WEBRTC_TURN_URL, env.WEBRTC_TURN_USERNAME, env.WEBRTC_TURN_CREDENTIAL];
  if (turnValues.some(Boolean) && !turnValues.every(Boolean)) {
    context.addIssue({ code: 'custom', path: ['WEBRTC_TURN_URL'], message: 'TURN exige URL, usuário e credencial em conjunto.' });
  }
  if (!env.WEBRTC_SIGNALING_HOST && (env.WEBRTC_SIGNALING_PORT || env.WEBRTC_SIGNALING_PATH || env.WEBRTC_SIGNALING_SECURE !== undefined)) {
    context.addIssue({ code: 'custom', path: ['WEBRTC_SIGNALING_HOST'], message: 'Host de signaling é obrigatório quando suas opções são configuradas.' });
  }
  const vapidValues = [env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY, env.VAPID_SUBJECT];
  if (vapidValues.some(Boolean) && !vapidValues.every(Boolean)) {
    context.addIssue({ code: 'custom', path: ['VAPID_PUBLIC_KEY'], message: 'Web Push exige VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY e VAPID_SUBJECT em conjunto.' });
  }
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(source?: NodeJS.ProcessEnv): AppEnv {
  if (!source) {
    try {
      loadEnvFile();
    } catch (error) {
      const code = error instanceof Error && 'code' in error ? error.code : undefined;
      if (code !== 'ENOENT') throw error;
    }
  }
  return envSchema.parse(source ?? process.env);
}
