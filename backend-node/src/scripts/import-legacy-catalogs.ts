import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { loadEnv } from '../config/env.js';
import { createPool } from '../database/pool.js';

type Food={id:string;nome:string;cat:string;kcal:number;carb:number;prot:number;gord:number;fibra?:number;unid?:string;fonte?:string};
type Ingredient={nome:string;qtd:string;kcal?:number;carb?:number;prot?:number;gord?:number};
type Recipe={id:string;titulo:string;categoria:string;tempo_preparo?:string;rendimento?:string;instrucoes:string;alimentosList?:Ingredient[]};
type Template={id:string;titulo:string;objetivo?:string;kcal?:number;metaKcal?:number;[key:string]:unknown};
const legacyRoot=resolve(process.cwd(),'..');
const run=(source:string, suffix:string)=>{const sandbox:{window:Record<string,unknown>}={window:{}};vm.runInNewContext(`${source}\n${suffix}`,sandbox);return sandbox.window};
const taco=run(await readFile(resolve(legacyRoot,'assets/js/taco-db.js'),'utf8'),'window.__data=TACO_DATABASE;').__data as Food[];
const recipes=run(await readFile(resolve(legacyRoot,'assets/js/receitas-db.js'),'utf8'),'').RECEITAS_DATABASE as Recipe[];
const templates=run(await readFile(resolve(legacyRoot,'assets/js/modelos-planos.js'),'utf8'),'').MODELOS_PLANOS_NUTRI as Template[];
const db=createPool(loadEnv()); const client=await db.connect();
const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
try{await client.query('BEGIN');const foodMap=new Map<string,string>();
 for(const food of taco){const unit=String(food.unid||'100g');const result=await client.query<{id:string}>(`INSERT INTO foods(legacy_id,name,category,source,reference_unit,kcal,carbohydrate,protein,fat,fiber)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(legacy_id) DO UPDATE SET name=excluded.name,category=excluded.category,source=excluded.source,reference_unit=excluded.reference_unit,kcal=excluded.kcal,carbohydrate=excluded.carbohydrate,protein=excluded.protein,fat=excluded.fat,fiber=excluded.fiber,updated_at=now() RETURNING id`,[food.id,food.nome,food.cat,food.fonte||'Tabela TACO curada',unit,food.kcal||0,food.carb||0,food.prot||0,food.gord||0,food.fibra||0]);foodMap.set(normalize(food.nome),result.rows[0]!.id)}
 for(const recipe of recipes){const saved=await client.query<{id:string}>(`INSERT INTO recipes(legacy_id,title,category,preparation_time,yield_text,instructions) VALUES($1,$2,$3,$4,$5,$6)
 ON CONFLICT(legacy_id) DO UPDATE SET title=excluded.title,category=excluded.category,preparation_time=excluded.preparation_time,yield_text=excluded.yield_text,instructions=excluded.instructions,updated_at=now() RETURNING id`,[recipe.id,recipe.titulo,recipe.categoria,recipe.tempo_preparo||null,recipe.rendimento||null,recipe.instrucoes]);const recipeId=saved.rows[0]!.id;await client.query('DELETE FROM recipe_ingredients WHERE recipe_id=$1',[recipeId]);let position=0;for(const ingredient of recipe.alimentosList||[]){position++;await client.query(`INSERT INTO recipe_ingredients(recipe_id,food_id,position,name_snapshot,amount_text,kcal,carbohydrate,protein,fat) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[recipeId,foodMap.get(normalize(ingredient.nome))||null,position,ingredient.nome,ingredient.qtd||'',ingredient.kcal||0,ingredient.carb||0,ingredient.prot||0,ingredient.gord||0])}}
 for(const template of templates){await client.query(`INSERT INTO meal_plan_templates(legacy_id,title,objective,target_kcal,content) VALUES($1,$2,$3,$4,$5)
 ON CONFLICT(legacy_id) DO UPDATE SET title=excluded.title,objective=excluded.objective,target_kcal=excluded.target_kcal,content=excluded.content,updated_at=now()`,[template.id,template.titulo,template.objetivo||null,template.kcal||template.metaKcal||null,template])}
 await client.query('COMMIT');console.log(`Importados: ${taco.length} alimentos, ${recipes.length} receitas e ${templates.length} modelos.`)}catch(error){await client.query('ROLLBACK');throw error}finally{client.release();await db.end()}
