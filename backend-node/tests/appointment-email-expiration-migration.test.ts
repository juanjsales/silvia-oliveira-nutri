import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('appointment email outbox migration adds a mandatory delivery deadline', async()=>{
  const sql=await readFile(new URL('../src/database/migrations/042_appointment_email_expiration.sql',import.meta.url),'utf8');
  assert.match(sql,/ADD COLUMN IF NOT EXISTS deliver_before timestamptz/i);
  assert.match(sql,/ALTER COLUMN deliver_before SET NOT NULL/i);
  assert.match(sql,/created_at \+ interval '7 days'/i);
});
