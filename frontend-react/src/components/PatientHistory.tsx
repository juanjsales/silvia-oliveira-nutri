import { Activity, Beaker, CalendarDays, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

type HistoryEncounter={id:string;status:string;startedAt:string;completedAt?:string|null;sections:Record<string,Record<string,unknown>>};
type Lab={id:string;examDate?:string|null;marker:string;value:string;unit?:string|null;referenceValue?:string|null;status?:string|null};
type History={encounters:HistoryEncounter[];labs:Lab[]};

export function PatientHistory({patientId}:{patientId:string}){
 const[data,setData]=useState<History|null>(null);const[error,setError]=useState('');
 useEffect(()=>{api<{data:History}>(`/api/encounters/patient/${patientId}/history`).then(r=>setData(r.data)).catch(c=>setError(c instanceof Error?c.message:'Erro ao carregar histórico.'))},[patientId]);
 const measurements=useMemo(()=>data?.encounters.map(e=>{const a=e.sections.assessment||{};const weight=Number(a.weight);const height=Number(a.height);return{id:e.id,date:e.startedAt,weight:Number.isFinite(weight)&&weight>0?weight:null,bmi:weight>0&&height>0?weight/(height/100)**2:null,waist:Number(a.waist)||null,bodyFat:Number(a.bodyFat)||null}}).filter(m=>m.weight).reverse()||[],[data]);
 if(error)return <div className="form-error">{error}</div>;if(!data)return <div className="empty-state"><span className="spinner"/><strong>Carregando evolução...</strong></div>;
 const first=measurements[0],last=measurements.at(-1);const delta=first&&last?last.weight!-first.weight!:0;
 return <div className="patient-history"><section className="history-metrics"><article><CalendarDays/><span>Atendimentos</span><strong>{data.encounters.length}</strong></article><article>{delta<=0?<TrendingDown/>:<TrendingUp/>}<span>Variação de peso</span><strong>{measurements.length>1?`${delta>0?'+':''}${delta.toFixed(1)} kg`:'—'}</strong></article><article><Activity/><span>Último IMC</span><strong>{last?.bmi?.toFixed(1)||'—'}</strong></article><article><Beaker/><span>Exames registrados</span><strong>{data.labs.length}</strong></article></section>
 <section className="history-chart"><h3>Evolução corporal</h3>{measurements.length===0?<p>Registre avaliações corporais para visualizar a evolução.</p>:<div className="weight-bars">{measurements.map((m,index)=>{const values=measurements.map(x=>x.weight!);const min=Math.min(...values);const max=Math.max(...values);const height=35+((m.weight!-min)/(max-min||1))*65;return <div key={m.id}><span>{m.weight!.toFixed(1)}</span><i style={{height:`${height}%`}}/><small>{new Date(m.date).toLocaleDateString('pt-BR',{month:'short',year:'2-digit'})}</small>{index===measurements.length-1&&<b>Atual</b>}</div>})}</div>}</section>
 <div className="history-columns"><section><h3>Linha do tempo</h3>{data.encounters.map(e=><article className="timeline-card" key={e.id}><i/><div><strong>{new Date(e.startedAt).toLocaleDateString('pt-BR')}</strong><span>{e.status==='COMPLETED'?'Atendimento finalizado':'Em andamento'} · {Object.keys(e.sections).length} etapas</span></div></article>)}</section><section><h3>Exames recentes</h3>{data.labs.slice(0,10).map(l=><article className="history-lab" key={l.id}><div><strong>{l.marker}</strong><span>{l.examDate?new Date(`${l.examDate}T12:00:00`).toLocaleDateString('pt-BR'):'Sem data'}</span></div><b>{l.value} {l.unit}</b><small className={(l.status||'').toLowerCase().includes('alter')?'alert':''}>{l.status||l.referenceValue||'Sem classificação'}</small></article>)}</section></div></div>;
}
