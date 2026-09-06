import { readFile } from 'node:fs/promises';
import { createPool } from '../database/pool.js';
import { loadEnv } from '../config/env.js';

const db = createPool(loadEnv());
const client = await db.connect();
try {
  const sql = await readFile(new URL('../database/seeds/20260906_three_fit_recipes.sql', import.meta.url), 'utf8');
  await client.query('BEGIN');
  await client.query(sql);
  await client.query('COMMIT');
  process.stdout.write('Três receitas cadastradas ou atualizadas com sucesso.\n');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await db.end();
}
