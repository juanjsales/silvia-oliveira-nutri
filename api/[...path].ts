import type { IncomingMessage, ServerResponse } from 'node:http';
import { loadEnv } from '../backend-node/src/config/env.js';
import { createPool } from '../backend-node/src/database/pool.js';
import { buildApp } from '../backend-node/src/app.js';

const env = loadEnv();
const db = createPool(env);
const appPromise = buildApp(env, db).then(async app => { await app.ready(); return app; });

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  const app = await appPromise;
  app.server.emit('request', request, response);
}
