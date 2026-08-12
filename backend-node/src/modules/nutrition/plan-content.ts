type JsonObject=Record<string,unknown>;
type Macro={kcal:number;protein:number;carbohydrate:number;fat:number};

const number=(value:unknown)=>Number(value)||0;
const normalize=(value:unknown)=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const macro=(value:JsonObject):Macro=>({kcal:number(value.kcal),protein:number(value.protein??value.prot),carbohydrate:number(value.carbohydrate??value.carb),fat:number(value.fat??value.gord)});
const hasNutrition=(value:Macro)=>value.kcal>0||value.protein>0||value.carbohydrate>0||value.fat>0;

export function restorePlanNutrition(content:unknown,template:unknown){
 const byId=new Map<string,Macro>();const byName=new Map<string,Macro>();
 function index(value:unknown){if(Array.isArray(value)){value.forEach(index);return}if(!value||typeof value!=='object')return;const object=value as JsonObject;const nutrients=macro(object);if(hasNutrition(nutrients)){if(object.id)byId.set(String(object.id),nutrients);const name=normalize(object.name??object.nome);if(name)byName.set(name,nutrients)}Object.values(object).forEach(index)}
 index(template);
 function repair(value:unknown):unknown{if(Array.isArray(value))return value.map(repair);if(!value||typeof value!=='object')return value;const object=value as JsonObject;const repaired=Object.fromEntries(Object.entries(object).map(([key,item])=>[key,repair(item)]));const current=macro((object.macros&&typeof object.macros==='object'?object.macros:object)as JsonObject);if(hasNutrition(current))return repaired;const source=(object.id?byId.get(String(object.id)):undefined)??byName.get(normalize(object.name??object.nome));return source?{...repaired,macros:source}:repaired}
 return repair(content);
}
