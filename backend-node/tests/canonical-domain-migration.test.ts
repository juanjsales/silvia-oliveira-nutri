import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('canonical domain migration repairs only app-owned absolute URLs', async () => {
  const sql = await readFile(new URL('../src/database/migrations/041_canonical_domain.sql', import.meta.url), 'utf8');
  assert.match(sql, /UPDATE appointments/);
  assert.match(sql, /UPDATE clinic_settings/);
  assert.match(sql, /silviaoliveira\.vercel\.app/);
  assert.doesNotMatch(sql, /patient_exam_uploads/);
  assert.doesNotMatch(sql, /push_subscriptions/);
});
