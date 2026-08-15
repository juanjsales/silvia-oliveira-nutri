import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const migration=readFileSync(new URL('../src/database/migrations/024_longitudinal_clinical_core.sql',import.meta.url),'utf8');
test('longitudinal clinical migration creates protected patient-owned records',()=>{
 for(const table of ['clinical_problems','clinical_therapies','clinical_followup_tasks','clinical_alert_dismissals']){
  assert.match(migration,new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  assert.match(migration,new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`));
 }
 assert.match(migration,/laboratory_results ADD COLUMN IF NOT EXISTS numeric_value/);
 assert.match(migration,/REFERENCES patients\(id\) ON DELETE RESTRICT/);
 assert.match(migration,/clinical_encounters_id_patient_unique/);
 assert.equal((migration.match(/FOREIGN KEY \(source_encounter_id, patient_id\)/g)||[]).length,3);
 assert.match(migration,/clinical_problems_resolution_consistency/);
 assert.match(migration,/clinical_therapies_dates_ordered/);
 assert.match(migration,/clinical_followup_tasks_completion_consistency/);
});
