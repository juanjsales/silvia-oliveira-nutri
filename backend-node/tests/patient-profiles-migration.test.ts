import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('patient profile migration is extensible and defaults existing patients safely', async () => {
  const sql = await readFile(new URL('../src/database/migrations/030_patient_profiles.sql', import.meta.url), 'utf8');
  assert.match(sql, /profiles text\[\] NOT NULL DEFAULT ARRAY\[\]::text\[\]/i);
  assert.match(sql, /profile_notes text/i);
  assert.match(sql, /nunca inferidos/i);
});
