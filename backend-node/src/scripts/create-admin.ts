import { z } from 'zod';
import { loadEnv } from '../config/env.js';
import { createPool } from '../database/pool.js';
import { hashPassword } from '../shared/crypto.js';

const args = z.tuple([z.string().email(), z.string().min(12)]).parse(process.argv.slice(2));
const [email, password] = args;
const db = createPool(loadEnv());
await db.query(
  `INSERT INTO users(email, password_hash, role) VALUES ($1, $2, 'ADMIN')
   ON CONFLICT (lower(email)) DO UPDATE SET password_hash=excluded.password_hash, active=true, updated_at=now()`,
  [email.toLowerCase(), await hashPassword(password)]
);
await db.end();
console.log('Administradora configurada com sucesso.');
