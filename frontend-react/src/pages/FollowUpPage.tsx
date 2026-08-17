import { Activity, BookOpen, Plus, RefreshCw, Target } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
type Patient={id:string;name:string};type Diary={id:string;entryDate:string;mealNotes?:string;symptoms?:string;hunger?:number;satiety?:number;waterLiters?:number;adherence?:number};type Goal={id:string;title:string;description?:string;dueDate?:string;status:'ACTIVE'|'COMPLETED'|'CANCELLED'};type Measurement={id:string;measuredAt:string;weight?:number;bodyFat?:number;waist?:number;visibleToPatient:boolean};type FollowUp={patient:Patient;diary:Diary[];goals:Goal[];measurements:Measurement[];encounters:{id:string;startedAt:string}[]};
const showDate=(v:string)=>new Date(`${v}T12:00:00`).toLocaleDateString('pt-BR');const optionalNumber=(v:FormDataEntryValue|null)=>v===''||v==null?undefined:Number(v);
export function FollowUpPage(){const[patients,setPatients]=useState<Patient[]>([]);const[selected,setSelected]=useState('');const[data,setData]=useState<FollowUp|null>(null);const[loading,setLoading]=useState(true);const[error,setError]=useState('');const[notice,setNotice]=useState('');
 const load=useCallback(async(id:string)=>{if(!id){setData(null);return}setLoading(true);setError('');try{setData((await api<{data:FollowUp}>(`/api/follow-up/${id}`)).data)}catch(e){setError(e instanceof Error?e.message:'Falha ao carregar acompanhamento.')}finally{setLoading(false)}},[]);
 useEffect(()=>{api<{data:Patient[]}>('/api/patients').then(r=>{setPatients(r.data);const id=r.data[0]?.id||'';setSelected(id);if(id)void load(id)}).catch(e=>setError(e instanceof Error?e.message:'Falha ao carregar pacientes.')).finally(()=>setLoading(false))},[load]);
 async function addGoal(e:FormEvent<HTMLFormElement>){e.preventDefault();const form=e.currentTarget,f=new FormData(form);setError('');try{await api(`/api/follow-up/${selected}/goals`,{method:'POST',body:JSON.stringify({title:f.get('title'),description:f.get('description')||undefined,dueDate:f.get('dueDate')||undefined})});form.reset();setNotice('Meta publicada no portal do paciente.');await load(selected)}catch(x){setError(x instanceof Error?x.message:'Falha ao criar meta.')}}
 async function setStatus(id:string,status:Goal['status']){try{await api(`/api/follow-up/goals/${id}`,{method:'PATCH',body:JSON.stringify({status})});await load(selected)}catch(x){setError(x instanceof Error?x.message:'Falha ao atualizar meta.')}}
 async function addMeasure(e:FormEvent<HTMLFormElement>){e.preventDefault();const form=e.currentTarget,f=new FormData(form);setError('');try{await api(`/api/follow-up/${selected}/measurements`,{method:'POST',body:JSON.stringify({measuredAt:f.get('measuredAt'),weight:optionalNumber(f.get('weight')),bodyFat:optionalNumber(f.get('bodyFat')),waist:optionalNumber(f.get('waist')),notes:f.get('notes')||undefined,visibleToPatient:f.get('visibleToPatient')==='on'})});form.reset();setNotice('Medida registrada com sucesso.');await load(selected)}catch(x){setError(x instanceof Error?x.message:'Falha ao registrar medida.')}}
 async function importDiary(sourceId:string){const encounter=data?.encounters[0];if(!encounter){setError('Inicie um atendimento para incorporar o diário.');return}setError('');try{await api(`/api/encounters/${encounter.id}/import-clinical`,{method:'POST',body:JSON.stringify({sourceType:'DIARY',sourceId})});setNotice('Registro incorporado à etapa Anotações do atendimento.')}catch(x){setError(x instanceof Error?x.message:'Falha ao incorporar o diário.')}}
 return <section className="follow-up-page">
<header className="follow-up-intro">
<p>Diário, metas e evolução corporal em um só lugar.</p>
<label>Paciente<select value={selected} onChange={e=>{setSelected(e.target.value);void load(e.target.value)}}>
<option value="">Selecione</option>{patients.map(p=>
<option key={p.id} value={p.id}>{p.name}</option>)}</select>
</label>
<button className="secondary-button" disabled={!selected||loading} onClick={()=>void load(selected)}>
<RefreshCw/> Atualizar</button>
</header>{error&&<div className="form-error">{error}</div>}{notice&&<div className="form-success">{notice}</div>}{loading&&!data?<div className="empty-state">
<span className="spinner"/>
</div>:data&&<div className="follow-up-grid">
<article className="panel">
<h2>
<BookOpen/> Diário alimentar</h2>{data.diary.length?data.diary.map(d=>
<div className="diary-entry" key={d.id}>
<strong>{showDate(d.entryDate)}</strong>{d.mealNotes&&<p>{d.mealNotes}</p>}{d.symptoms&&<small>
<b>Sintomas:</b> {d.symptoms}</small>}<div className="entry-metrics">
<span>Fome {d.hunger??'—'}/10</span>
<span>Saciedade {d.satiety??'—'}/10</span>
<span>Água {d.waterLiters??'—'} L</span>
<span>Adesão {d.adherence??'—'}%</span>
</div>
<button className="secondary-button" type="button" disabled={!data.encounters.length} onClick={()=>void importDiary(d.id)}>Incorporar à evolução</button>
</div>):<p className="muted">Nenhum registro no diário.</p>}</article>
<div className="follow-up-side">
<article className="panel">
<h2>
<Target/> Metas</h2>
<form className="compact-form" onSubmit={addGoal}>
<input name="title" required maxLength={160} placeholder="Nova meta"/>
<textarea name="description" maxLength={1000} placeholder="Orientação (opcional)"/>
<label>Prazo<input name="dueDate" type="date"/>
</label>
<button className="primary-button">
<Plus/> Criar meta</button>
</form>
<div className="simple-list">{data.goals.filter(g=>g.status!=='CANCELLED').map(g=>
<div key={g.id}>
<span>
<strong>{g.title}</strong>{g.description&&<small>{g.description}</small>}{g.dueDate&&<small>Prazo: {showDate(g.dueDate)}</small>}</span>
<select value={g.status} onChange={e=>void setStatus(g.id,e.target.value as Goal['status'])}>
<option value="ACTIVE">Ativa</option>
<option value="COMPLETED">Concluída</option>
<option value="CANCELLED">Cancelar</option>
</select>
</div>)}</div>
</article>
<article className="panel">
<h2>
<Activity/> Evolução corporal</h2>
<form className="compact-form measure-form" onSubmit={addMeasure}>
<label>Data<input name="measuredAt" type="date" required defaultValue={new Date().toISOString().slice(0,10)}/>
</label>
<input name="weight" type="number" step="0.01" min="0" placeholder="Peso (kg)"/>
<input name="bodyFat" type="number" step="0.01" min="0" max="100" placeholder="Gordura (%)"/>
<input name="waist" type="number" step="0.01" min="0" placeholder="Cintura (cm)"/>
<input name="notes" maxLength={1000} placeholder="Observações"/>
<label className="check">
<input name="visibleToPatient" type="checkbox" defaultChecked/> Visível ao paciente</label>
<button className="primary-button">
<Plus/> Registrar</button>
</form>
<div className="simple-list">{data.measurements.map(m=>
<div key={m.id}>
<span>
<strong>{showDate(m.measuredAt)}</strong>
<small>{[m.weight!=null&&`${m.weight} kg`,m.bodyFat!=null&&`${m.bodyFat}% gordura`,m.waist!=null&&`${m.waist} cm cintura`].filter(Boolean).join(' · ')}</small>
</span>
<small>{m.visibleToPatient?'Portal':'Privado'}</small>
</div>)}</div>
</article>
</div>
</div>}</section>}
