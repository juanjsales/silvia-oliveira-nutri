import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import test from'node:test';
const sql=await readFile(new URL('../src/database/migrations/049_installation_license.sql',import.meta.url),'utf8');
test('licença persistida é singleton, auditável e inacessível pela Data API',()=>{assert.match(sql,/singleton boolean PRIMARY KEY/i);assert.match(sql,/installed_by uuid REFERENCES users/i);assert.match(sql,/REVOKE ALL ON installation_license FROM PUBLIC/i)});
