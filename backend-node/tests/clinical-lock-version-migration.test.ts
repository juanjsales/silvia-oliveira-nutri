import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('clinical section concurrency uses an explicit monotonic version', async () => {
  const sql=await readFile(new URL('../src/database/migrations/034_clinical_section_lock_version.sql',import.meta.url),'utf8');
  const routes=await readFile(new URL('../src/modules/encounters/routes.ts',import.meta.url),'utf8');
  assert.match(sql,/lock_version bigint NOT NULL DEFAULT 1/i);
  assert.match(routes,/lock_version=lock_version\+1/);
  assert.match(routes,/lock_version=\$5/);
  assert.match(routes,/lock_version::int AS version/);
});
