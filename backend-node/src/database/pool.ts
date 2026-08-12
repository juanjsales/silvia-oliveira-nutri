import pg from 'pg';
import type { AppEnv } from '../config/env.js';

export function createPool(env: AppEnv) {
  return new pg.Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000
  });
}

export function createMigrationPool(env: AppEnv) {
  return new pg.Pool({ connectionString: env.MIGRATION_DATABASE_URL || env.DATABASE_URL, max: 1 });
}

export type Database = ReturnType<typeof createPool>;
