import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('encounter details expose the registered patient email under the frontend contract',async()=>{
  const routes=await readFile(new URL('../src/modules/encounters/routes.ts',import.meta.url),'utf8');
  assert.match(routes,/p\.email AS "patientEmail"/);
  assert.match(routes,/body\.emailRecipient \|\| encounterInfo\.rows\[0\]\.patientEmail/);
});
