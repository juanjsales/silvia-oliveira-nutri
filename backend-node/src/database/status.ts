import { loadEnv } from '../config/env.js';
import { createMigrationPool } from './pool.js';
import { schemaStatus } from './schema-version.js';

const db = createMigrationPool(loadEnv());

try {
  const status = await schemaStatus(db);
  console.log(JSON.stringify(status, null, 2));
  if (!status.ready) process.exitCode = 1;
} finally {
  await db.end();
}
