import pg from 'pg';
import type { AppEnv } from '../config/env.js';

export function createPool(env: AppEnv) {
  return new pg.Pool({
    connectionString: env.DATABASE_URL,
    max: env.DB_POOL_MAX,
    connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT_MS,
    idleTimeoutMillis: env.DB_IDLE_TIMEOUT_MS,
    allowExitOnIdle: true
  });
}

export function createMigrationPool(env: AppEnv) {
  return new pg.Pool({
    connectionString: env.MIGRATION_DATABASE_URL || env.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT_MS,
    idleTimeoutMillis: env.DB_IDLE_TIMEOUT_MS,
    allowExitOnIdle: true
  });
}

export type Database = ReturnType<typeof createPool>;
