import { loadEnv } from './config/env.js';
import { createPool } from './database/pool.js';
import { buildApp } from './app.js';

const env = loadEnv();
const db = createPool(env);
const app = await buildApp(env, db);

const shutdown = async () => {
  await app.close();
  await db.end();
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await app.listen({ host: env.HOST, port: env.PORT });
