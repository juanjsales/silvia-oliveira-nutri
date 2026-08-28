import { AlertTriangle, ArrowLeft, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { availablePlanDays, currentPlanDay, mealsForDay, planMeals } from '../lib/mealPlanSchedule';

type Macro={kcal?:number;protein?:number;carbohydrate?:number;fat?:number};
type Plan={id:string;title:string;objective?:string;status:'PUBLISHED'|'ARCHIVED';publishedAt?:string;updatedAt:string;content:Record<string,any>};
const value=(input:unknown)=>Number(input)||0;
const itemMacros=(item:any):Macro=>item.macros||{kcal:item.kcal,protein:item.prot,carbohydrate:item.carb,fat:item.gord};
const mealMacros=(meal:any)=>(meal.items||meal.alimentosList||[]).reduce((sum:Required<Macro>,item:any)=>{const macro=itemMacros(item);return{kcal:sum.kcal+value(macro.kcal),protein:sum.protein+value(macro.protein),carbohydrate:sum.carbohydrate+value(macro.carbohydrate),fat:sum.fat+value(macro.fat)}},{kcal:0,protein:0,carbohydrate:0,fat:0});

export function PatientPlanPage(){
 const{id}=useParams();const[plan,setPlan]=useState<Plan|null>(null);const[error,setError]=useState('');const[selectedDay,setSelectedDay]=useState<number|null>(null);
 useEffect(()=>{if(id)api<{data:Plan}>(`/api/portal/plans/${id}`).then(r=>setPlan(r.data)).catch(c=>setError(c instanceof Error?c.message:'Erro ao abrir plano.'))},[id]);
 if(error)return <div className="document-loading">{error}</div>;if(!plan)return <div className="document-loading">Carregando plano...</div>;
 const allMeals=planMeals(plan.content) as any[],days=availablePlanDays(allMeals),effectiveDay=selectedDay??currentPlanDay(allMeals),meals=mealsForDay(allMeals,effectiveDay),visibility=plan.content.patientVisibility||'SUMMARY',showDetails=visibility!=='HIDDEN',showNutrition=visibility==='FULL';
 return <main className="patient-plan"><header><Link to="/portal"><ArrowLeft/> Voltar ao portal</Link><button onClick={()=>window.print()}><Printer/> Imprimir</button></header><article>
  {plan.status==='ARCHIVED'&&<div className="archived-plan-warning"><AlertTriangle/><div><strong>Este é um plano anterior</strong><span>Consulte o plano vigente no portal antes de seguir estas orientações.</span></div></div>}
  <span>{plan.status==='PUBLISHED'?'Plano alimentar vigente':'Histórico de plano alimentar'}</span><h1>{plan.title}</h1><p>{plan.objective}</p><small>{plan.publishedAt?`Publicado em ${new Date(plan.publishedAt).toLocaleDateString('pt-BR')} · `:''}Atualizado em {new Date(plan.updatedAt).toLocaleDateString('pt-BR')}</small>
  {days.length>0&&<nav className="plan-day-tabs" aria-label="Dia do plano semanal">{days.map(day=><button type="button" key={day.value} className={effectiveDay===day.value?'active':''} onClick={()=>setSelectedDay(day.value)}><span>{day.short}</span><small>{day.label}</small></button>)}</nav>}
  {meals.map((meal,index)=>{const macros=mealMacros(meal);return <section key={index}><header><span>{showDetails?(meal.time||meal.horario||'Horário flexível'):'Horário conforme orientação'}</span><h2>{meal.title||meal.titulo||'Refeição'}</h2>{showNutrition&&<small>{macros.kcal.toFixed(0)} kcal · P {macros.protein.toFixed(1)}g · C {macros.carbohydrate.toFixed(1)}g · G {macros.fat.toFixed(1)}g</small>}</header>{(meal.items||meal.alimentosList||[]).map((item:any,i:number)=>{const macros=itemMacros(item);return <div key={i}><strong>{item.name||item.nome}</strong><span>{showDetails?(item.amountText||((item.amount??item.qtd)?`${item.amount??item.qtd} ${item.unit||item.unidade||'g'}`:'Conforme orientação')):'Conforme orientação'}</span>{showNutrition&&<small>{value(macros.kcal).toFixed(0)} kcal · P {value(macros.protein).toFixed(1)}g · C {value(macros.carbohydrate).toFixed(1)}g · G {value(macros.fat).toFixed(1)}g</small>}</div>})}{meal.substitutions?.length?<div className="patient-substitutions"><strong>Substituições</strong><ul>{meal.substitutions.map((item:string|{option?:string;equivalence?:string},i:number)=><li key={i}>{typeof item==='string'?item:<><b>{item.option}</b>{item.equivalence&&<small> · {item.equivalence}</small>}</>}</li>)}</ul></div>:null}{(meal.notes||meal.obs)&&<p>{meal.notes||meal.obs}</p>}</section>})}
 </article></main>
}
