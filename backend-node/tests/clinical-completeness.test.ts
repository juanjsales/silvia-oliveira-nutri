import test from'node:test';import assert from'node:assert/strict';import{missingClinicalCore}from'../src/shared/clinical-completeness.js';
test('first consultation requires context anamnesis and conduct',()=>{assert.deepEqual(missingClinicalCore(['context','anamnesis','conduct']),[]);assert.deepEqual(missingClinicalCore(['assessment','notes']),['Contexto','Anamnese ou Retorno','Conduta'])});
test('follow-up can replace anamnesis in the clinical core',()=>{assert.deepEqual(missingClinicalCore(['context','followup','conduct']),[])});
