import assert from 'node:assert/strict';
import test from 'node:test';
import { restorePlanNutrition } from '../src/modules/nutrition/plan-content.js';

test('restores macros removed from an old plan using its template item id',()=>{
 const plan={meals:[{items:[{id:'m16_1',name:'Ovo',amount:3,macros:{kcal:0,protein:0,carbohydrate:0,fat:0}}]}]};
 const template={refeicoes:[{alimentosList:[{id:'m16_1',nome:'Ovo',kcal:210,prot:18,carb:1.5,gord:14}]}]};
 const restored=restorePlanNutrition(plan,template) as typeof plan;
 assert.deepEqual(restored.meals[0]!.items[0]!.macros,{kcal:210,protein:18,carbohydrate:1.5,fat:14});
});

test('preserves manually edited macros already present in the plan',()=>{
 const plan={meals:[{items:[{id:'food',name:'Alimento',macros:{kcal:99,protein:8,carbohydrate:7,fat:6}}]}]};
 const template={items:[{id:'food',nome:'Alimento',kcal:200,prot:20,carb:30,gord:10}]};
 const restored=restorePlanNutrition(plan,template) as typeof plan;
 assert.deepEqual(restored.meals[0]!.items[0]!.macros,plan.meals[0]!.items[0]!.macros);
});
