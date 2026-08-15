import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const migration=readFileSync(new URL('../src/database/migrations/025_preconsult_checkins.sql',import.meta.url),'utf8');

test('preconsult check-ins enforce ownership and database access protection',()=>{
 assert.match(migration,/FOREIGN KEY \(appointment_id, patient_id\)/);
 assert.match(migration,/REFERENCES appointments\(id, patient_id\)/);
 assert.match(migration,/preconsult_checkins_review_consistency/);
 assert.match(migration,/jsonb_typeof\(answers\) = 'object'/);
 assert.match(migration,/ALTER TABLE preconsult_checkins ENABLE ROW LEVEL SECURITY/);
 assert.match(migration,/REVOKE ALL ON preconsult_checkins FROM anon/);
 assert.match(migration,/REVOKE ALL ON preconsult_checkins FROM authenticated/);
});
