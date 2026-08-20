import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('migration 029 adds an optional validated neck circumference', async () => {
  const sql = await readFile(
    new URL('../src/database/migrations/029_patient_measurement_neck.sql', import.meta.url),
    'utf8',
  );

  assert.match(sql, /ADD COLUMN IF NOT EXISTS neck numeric\(6,2\)/);
  assert.match(sql, /neck IS NULL OR \(neck > 0 AND neck <= 200\)/);
});

test('neck circumference is carried through professional, patient and LGPD APIs', async () => {
  const [followUp, portal, privacy] = await Promise.all([
    readFile(new URL('../src/modules/follow-up/routes.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/modules/portal/routes.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/modules/privacy/routes.ts', import.meta.url), 'utf8'),
  ]);

  assert.match(followUp, /neck::float8/);
  assert.match(followUp, /neck:z\.number\(\)\.positive\(\)\.max\(200\)\.optional\(\)/);
  assert.match(followUp, /patient_measurements\(patient_id,measured_at,weight,body_fat,waist,neck,notes,visible_to_patient\)/);
  assert.match(portal, /waist::float8,neck::float8/);
  assert.match(privacy, /measured_at,weight,body_fat,waist,neck,visible_to_patient/);
});
