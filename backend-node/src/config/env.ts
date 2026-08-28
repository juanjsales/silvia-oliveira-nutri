import { loadEnvFile } from 'node:process';
import { z } from 'zod';

const optionalText = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(value => typeof value === 'string' && value.trim() === '' ? undefined : value, schema.optional());

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
  VERCEL_URL: optionalText(z.string().regex(/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i)),
  LEGACY_APP_ORIGINS: z.string().optional(),
  SESSION_COOKIE_NAME: z.string().min(1).default('nutri_session'),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().max(168).default(6),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().max(120).default(30),
  PATIENT_INVITATION_TTL_HOURS: z.coerce.number().int().positive().max(168).default(24),
  APP_URL: z.string().url(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.preprocess(v => v === true || v === 'true', z.boolean()).default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().min(1),
  APP_ENCRYPTION_KEY: z.string().min(32).optional(),
  VERCEL_OAUTH_CLIENT_ID: optionalText(z.string().min(3)),
  VERCEL_OAUTH_CLIENT_SECRET: optionalText(z.string().min(12)),
  VERCEL_OAUTH_REDIRECT_URI: optionalText(z.string().url()),
  VERCEL_INTEGRATION_SLUG: optionalText(z.string().regex(/^[a-z0-9-]+$/)),
  SUPABASE_OAUTH_CLIENT_ID: optionalText(z.string().min(3)),
  SUPABASE_OAUTH_CLIENT_SECRET: optionalText(z.string().min(12)),
  SUPABASE_OAUTH_REDIRECT_URI: optionalText(z.string().url()),
  DEPLOYMENT_ENVIRONMENT: optionalText(z.enum(['staging', 'production'])),
  ALLOW_EXTERNAL_PROVIDER_PROVISIONING: z.preprocess(v => v === undefined ? undefined : v === true || v === 'true', z.boolean().optional()),
  CONTROL_PLANE_ENABLED: z.preprocess(v => v === true || v === 'true', z.boolean()).default(false),
  PROVIDER_EXECUTION_CONFIRMATION: optionalText(z.string().min(12)),
  PROTECTED_PRODUCTION_PROJECT_ID: optionalText(z.string().min(3)),
  PROTECTED_PRODUCTION_DATABASE_ID: optionalText(z.string().min(3)),
  PREVIEW_ARTIFACT_PUBLIC_KEY: optionalText(z.string().min(32)),
  CRON_SECRET: optionalText(z.string().min(32)),
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
  ,LICENSE_PUBLIC_KEY: z.string().min(32).optional()
  ,INSTALLATION_ID: z.string().min(3).max(160).optional()
}).superRefine((env, context) => {
  const vercelOauth=[env.VERCEL_OAUTH_CLIENT_ID,env.VERCEL_OAUTH_CLIENT_SECRET,env.VERCEL_OAUTH_REDIRECT_URI,env.VERCEL_INTEGRATION_SLUG];
  if(vercelOauth.some(Boolean)&&!vercelOauth.every(Boolean))context.addIssue({code:'custom',path:['VERCEL_OAUTH_CLIENT_ID'],message:'Vercel OAuth exige client ID, client secret, redirect URI e slug da integração em conjunto.'});
  const supabaseOauth=[env.SUPABASE_OAUTH_CLIENT_ID,env.SUPABASE_OAUTH_CLIENT_SECRET,env.SUPABASE_OAUTH_REDIRECT_URI];
  if(supabaseOauth.some(Boolean)&&!supabaseOauth.every(Boolean))context.addIssue({code:'custom',path:['SUPABASE_OAUTH_CLIENT_ID'],message:'Supabase OAuth exige client ID, client secret e redirect URI em conjunto.'});
  if (Boolean(env.LICENSE_PUBLIC_KEY) !== Boolean(env.INSTALLATION_ID)) {
    context.addIssue({ code: 'custom', path: ['LICENSE_PUBLIC_KEY'], message: 'Licenciamento exige LICENSE_PUBLIC_KEY e INSTALLATION_ID em conjunto.' });
  }
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

// Optional at the construction boundary keeps existing typed test fixtures and
// embedded consumers compatible. loadEnv() always materializes the safe false default.
export type AppEnv = Omit<z.infer<typeof envSchema>, 'CONTROL_PLANE_ENABLED'> & { CONTROL_PLANE_ENABLED?: boolean };

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
