import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from '../config/env.js';
import { createMigrationPool } from './pool.js';

const env = loadEnv();
const db = createMigrationPool(env);
const directory = join(dirname(fileURLToPath(import.meta.url)), 'migrations');
const files = (await readdir(directory)).filter(file => file.endsWith('.sql')).sort();

await db.query('CREATE TABLE IF NOT EXISTS schema_migrations(filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
for (const filename of files) {
  const exists = await db.query('SELECT 1 FROM schema_migrations WHERE filename=$1', [filename]);
  if (exists.rowCount) continue;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(await readFile(join(directory, filename), 'utf8'));
    await client.query('INSERT INTO schema_migrations(filename) VALUES ($1) ON CONFLICT DO NOTHING', [filename]);
    await client.query('COMMIT');
    console.log(`Aplicada: ${filename}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
await db.end();
