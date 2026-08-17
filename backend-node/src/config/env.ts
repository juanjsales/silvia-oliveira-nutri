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
  CRON_SECRET: z.string().min(32).optional()
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
