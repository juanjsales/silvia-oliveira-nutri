import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('encounter corrections preserve the completed clinical record and appointment', async () => {
  const sql = await readFile(new URL('../src/database/migrations/033_encounter_corrections.sql', import.meta.url), 'utf8');
  const routes = await readFile(new URL('../src/modules/encounters/routes.ts', import.meta.url), 'utf8');
  assert.match(sql, /correction_open boolean NOT NULL DEFAULT false/i);
  assert.match(sql, /revision_count integer NOT NULL DEFAULT 0/i);
  assert.match(routes, /SET correction_open=true/);
  assert.doesNotMatch(routes, /SET status='IN_PROGRESS',completed_at=NULL/);
  assert.match(routes, /FROM meal_plans WHERE patient_id=/);
  assert.doesNotMatch(routes, /FROM nutrition_plans WHERE patient_id=/);
});
