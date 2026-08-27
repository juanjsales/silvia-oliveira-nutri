import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('daily check-in migration enforces one response per patient and local day', async () => {
  const sql=await readFile(new URL('../src/database/migrations/043_patient_daily_checkins.sql',import.meta.url),'utf8');
  assert.match(sql,/UNIQUE \(patient_id, checkin_date\)/);
  assert.match(sql,/EASY.*ADJUSTMENTS.*DIFFICULT.*NOT_TODAY/s);
  assert.match(sql,/America\/Sao_Paulo/);
});
