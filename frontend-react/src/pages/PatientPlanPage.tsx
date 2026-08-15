import { AlertTriangle, ArrowLeft, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';

type Plan={id:string;title:string;objective?:string;status:'PUBLISHED'|'ARCHIVED';publishedAt?:string;updatedAt:string;content:{meals?:any[];refeicoes?:any[]}};

export function PatientPlanPage(){
 const{id}=useParams();const[plan,setPlan]=useState<Plan|null>(null);const[error,setError]=useState('');
 useEffect(()=>{if(id)api<{data:Plan}>(`/api/portal/plans/${id}`).then(r=>setPlan(r.data)).catch(c=>setError(c instanceof Error?c.message:'Erro ao abrir plano.'))},[id]);
 if(error)return <div className="document-loading">{error}</div>;if(!plan)return <div className="document-loading">Carregando plano...</div>;
 const meals=plan.content.meals||plan.content.refeicoes||[];
 return <main className="patient-plan"><header><Link to="/portal"><ArrowLeft/> Voltar ao portal</Link><button onClick={()=>window.print()}><Printer/> Imprimir</button></header><article>
  {plan.status==='ARCHIVED'&&<div className="archived-plan-warning"><AlertTriangle/><div><strong>Este é um plano anterior</strong><span>Consulte o plano vigente no portal antes de seguir estas orientações.</span></div></div>}
  <span>{plan.status==='PUBLISHED'?'Plano alimentar vigente':'Histórico de plano alimentar'}</span><h1>{plan.title}</h1><p>{plan.objective}</p><small>{plan.publishedAt?`Publicado em ${new Date(plan.publishedAt).toLocaleDateString('pt-BR')} · `:''}Atualizado em {new Date(plan.updatedAt).toLocaleDateString('pt-BR')}</small>
  {meals.map((meal,index)=><section key={index}><header><span>{meal.time||meal.horario||'Horário flexível'}</span><h2>{meal.title||meal.titulo||'Refeição'}</h2></header>{(meal.items||meal.alimentosList||[]).map((item:any,i:number)=><div key={i}><strong>{item.name||item.nome}</strong><span>{item.amountText||((item.amount??item.qtd)?`${item.amount??item.qtd} ${item.unit||item.unidade||'g'}`:'Conforme orientação')}</span></div>)}{meal.substitutions?.length?<div className="patient-substitutions"><strong>Substituições</strong><ul>{meal.substitutions.map((item:string|{option?:string;equivalence?:string},i:number)=><li key={i}>{typeof item==='string'?item:<><b>{item.option}</b>{item.equivalence&&<small> · {item.equivalence}</small>}</>}</li>)}</ul></div>:null}{(meal.notes||meal.obs)&&<p>{meal.notes||meal.obs}</p>}</section>)}
 </article></main>
}
