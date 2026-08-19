import { ArrowLeft, CalendarCheck, CheckCircle2, Clock3, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { formatAppointmentSchedule } from '../lib/formatters';

type Appointment = { id:string; date:string; time:string; durationMinutes:number; type:string; status:string; patientResponse:'PENDING'|'CONFIRMED'|'RESCHEDULE_REQUESTED'; patientResponseNote?:string|null };
const responseLabel = (value:Appointment['patientResponse']) => ({ PENDING:'Aguardando sua confirmação', CONFIRMED:'Presença confirmada', RESCHEDULE_REQUESTED:'Reagendamento solicitado ao consultório' }[value]);

export function PatientAppointmentsPage(){
  const [items,setItems]=useState<Appointment[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [notice,setNotice]=useState('');
  const load=useCallback(async()=>{setLoading(true);setError('');try{setItems((await api<{data:Appointment[]}>('/api/portal/appointments')).data)}catch(cause){setError(cause instanceof Error?cause.message:'Não foi possível carregar consultas.')}finally{setLoading(false)}},[]);
  useEffect(()=>{void load()},[load]);
  async function respond(item:Appointment,response:'CONFIRMED'|'RESCHEDULE_REQUESTED'){
    const note=response==='RESCHEDULE_REQUESTED'?window.prompt('Explique brevemente o motivo ou informe sua disponibilidade:')?.trim()||'':undefined;
    if(response==='RESCHEDULE_REQUESTED'&&!note)return; setError('');
    try{const result=await api<{message:string}>(`/api/portal/appointments/${item.id}/response`,{method:'POST',body:JSON.stringify({response,note})});setNotice(result.message);await load()}catch(cause){setError(cause instanceof Error?cause.message:'Não foi possível registrar sua resposta.')}
  }
  return <main className="patient-portal patient-appointments-page"><header className="privacy-header"><Link className="ghost-button" to="/portal"><ArrowLeft/> Voltar ao portal</Link><span><CalendarCheck/> Minhas consultas</span></header>{error&&<div className="form-error">{error}</div>}{notice&&<div className="form-success"><CheckCircle2/>{notice}</div>}{loading?<div className="page-loader"><RefreshCw/><p>Carregando consultas...</p></div>:<section className="patient-confirmation-list">{items.length?items.map(item=><article className="panel" key={item.id}><div className="confirmation-date"><strong>{new Date(`${item.date}T12:00`).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</strong><span><Clock3/> {formatAppointmentSchedule(item.time, item.durationMinutes)}</span></div><div className="confirmation-description"><h2>{item.type}</h2><p data-response={item.patientResponse}>{responseLabel(item.patientResponse)}</p>{item.patientResponseNote&&<small>{item.patientResponseNote}</small>}</div><div className="confirmation-actions"><button className="primary-button" onClick={()=>void respond(item,'CONFIRMED')} disabled={item.patientResponse==='CONFIRMED'}><CheckCircle2/> {item.patientResponse==='CONFIRMED'?'Confirmada':'Confirmar presença'}</button><button className="secondary-button" onClick={()=>void respond(item,'RESCHEDULE_REQUESTED')}>Solicitar reagendamento</button></div></article>):<section className="panel empty-state"><CalendarCheck/><strong>Nenhuma consulta futura.</strong></section>}</section>}</main>
}

