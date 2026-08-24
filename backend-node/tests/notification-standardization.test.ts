import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runDatabasePrune } from '../src/shared/maintenance.js';

test('patient notification producers include lifecycle metadata and deduplication', async () => {
  const files = await Promise.all([
    readFile(new URL('../src/modules/appointments/routes.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/modules/messages/routes.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/modules/patient-appointments/routes.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/shared/appointment-email-outbox.ts', import.meta.url), 'utf8'),
  ]);
  for (const source of files) {
    assert.match(source, /entity_type/);
    assert.match(source, /dedupe_key/);
    assert.match(source, /expires_at/);
  }
  assert.match(files.join('\n'), /ON CONFLICT\(patient_id,dedupe_key\)/);
});

test('privacy requests enforce a forward-only workflow and dedupe patient updates', async () => {
  const source = await readFile(new URL('../src/modules/privacy/routes.ts', import.meta.url), 'utf8');
  assert.match(source, /status='OPEN' AND \$1='IN_REVIEW'/);
  assert.match(source, /status='IN_REVIEW' AND \$1 IN\('COMPLETED','REJECTED'\)/);
  assert.match(source, /privacy-request:update:/);
  assert.match(source, /Transição inválida/);
});

test('maintenance removes expired notifications even when unread', async () => {
  const statements: string[] = [];
  const db = {
    query: async (sql: string) => {
      statements.push(sql);
      return { rows: [], rowCount: 0 };
    },
  };
  await runDatabasePrune(db as never);
  const notificationPrune = statements.find((sql) => sql.includes('DELETE FROM patient_notifications')) ?? '';
  assert.match(notificationPrune, /expires_at < now\(\) OR/);
  assert.doesNotMatch(notificationPrune, /expires_at < now\(\) AND read_at/);
});
