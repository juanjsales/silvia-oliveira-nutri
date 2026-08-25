import { CalendarCheck2, CalendarDays, ChevronLeft, ChevronRight, Clock3, ExternalLink, Filter, MessageCircle, Plus, Search, UserRound, Video, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { getEndTime, formatAppointmentSchedule } from '../lib/formatters';
import { useConfirm } from '../components/ConfirmDialog';

type Patient = { id: string; name: string };
type AppointmentStatus = 'CONFIRMED'|'WAITING'|'IN_PROGRESS'|'COMPLETED'|'CANCELLED'|'NO_SHOW';
type Appointment = { id:string; patientId:string; patientName:string; whatsapp?:string|null; date:string; time:string; durationMinutes:number; type:string; price?:number|null; status:AppointmentStatus; notes?:string|null; meetingUrl?:string|null; patientResponse:'PENDING'|'CONFIRMED'|'RESCHEDULE_REQUESTED'; patientResponseNote?:string|null; encounterId?:string|null; encounterStatus?:string|null };
type FormState = { patientId:string; date:string; time:string; durationMinutes:string; type:string; price:string; status:AppointmentStatus; notes:string; meetingUrl:string };
type AppointmentRequest={id:string;patientId:string;patientName:string;preferredDate:string;preferredPeriod:'MORNING'|'AFTERNOON'|'EVENING';appointmentType:string;notes?:string|null;status:'PENDING'};
const statusLabels: Record<AppointmentStatus,string> = { CONFIRMED:'Confirmado', WAITING:'Aguardando confirmação', IN_PROGRESS:'Em atendimento', COMPLETED:'Concluído', CANCELLED:'Cancelado', NO_SHOW:'Não compareceu' };
const statusTransitions:Record<AppointmentStatus,AppointmentStatus[]>={
  CONFIRMED:['CONFIRMED','WAITING','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW'],
  WAITING:['WAITING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW'],
  IN_PROGRESS:['IN_PROGRESS','COMPLETED'],
  COMPLETED:['COMPLETED'],
  CANCELLED:['CANCELLED'],
  NO_SHOW:['NO_SHOW']
};
const newAppointmentStatuses:AppointmentStatus[]=['CONFIRMED','WAITING'];
const types = ['Avaliação Inicial','Presencial','Online (Teleconsulta)','Retorno de Avaliação','Retorno Online'];
const pad = (value:number) => String(value).padStart(2,'0');
const isoDate = (date:Date) => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
const todayIso = isoDate(new Date());
const initialForm = (date=todayIso):FormState => ({ patientId:'', date, time:'09:00', durationMinutes:'60', type:types[0], price:'250', status:'CONFIRMED', notes:'', meetingUrl:'' });

export function AgendaPage() {
  const confirm = useConfirm();
  const [month,setMonth]=useState(() => new Date(new Date().getFullYear(),new Date().getMonth(),1)); const [selected,setSelected]=useState(todayIso);
  const [appointments,setAppointments]=useState<Appointment[]>([]); const [patients,setPatients]=useState<Patient[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState('');const[notice,setNotice]=useState('');
  const[requests,setRequests]=useState<AppointmentRequest[]>([]);const[requestId,setRequestId]=useState<string|null>(null);const[editingId,setEditingId]=useState<string|null>(null);const[rebooking,setRebooking]=useState(false);
  const [open,setOpen]=useState(false); const [form,setForm]=useState<FormState>(()=>initialForm()); const [saving,setSaving]=useState(false);
  const [statusFilter,setStatusFilter]=useState<'ALL'|AppointmentStatus>('ALL'); const [search,setSearch]=useState('');
  const range=useMemo(()=>({from:isoDate(new Date(month.getFullYear(),month.getMonth(),1)),to:isoDate(new Date(month.getFullYear(),month.getMonth()+1,0))}),[month]);
  const load=useCallback(async()=>{setLoading(true);setError('');try{const[result,pending]=await Promise.all([api<{data:Appointment[]}>(`/api/appointments?from=${range.from}&to=${range.to}`),api<{data:AppointmentRequest[]}>('/api/appointments/requests')]);setAppointments(result.data);setRequests(pending.data)}catch(cause){setError(cause instanceof Error?cause.message:'Erro ao carregar agenda.')}finally{setLoading(false)}},[range]);
  useEffect(()=>{void load()},[load]);
  useEffect(()=>{api<{data:Patient[]}>('/api/patients').then(r=>setPatients(r.data)).catch(()=>undefined)},[]);
  const selectedItems=appointments
    .filter(item=>item.date.slice(0,10)===selected)
    .filter(item=>statusFilter==='ALL'||item.status===statusFilter)
    .filter(item=>`${item.patientName} ${item.type}`.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR')))
    .sort((a,b)=>a.time.localeCompare(b.time));
  const monthStats=useMemo(()=>({
    total:appointments.length,
    upcoming:appointments.filter(item=>['CONFIRMED','WAITING'].includes(item.status)).length,
    inProgress:appointments.filter(item=>item.status==='IN_PROGRESS').length,
    completed:appointments.filter(item=>item.status==='COMPLETED').length
  }),[appointments]);
  const editingAppointment=editingId?appointments.find(item=>item.id===editingId):undefined;
  const scheduleChanged=Boolean(editingAppointment&&(form.date!==editingAppointment.date.slice(0,10)||form.time!==editingAppointment.time.slice(0,5)));
  const formStatuses=editingAppointment
    ? [...new Set([...statusTransitions[editingAppointment.status],...(scheduleChanged&&['CANCELLED','NO_SHOW'].includes(editingAppointment.status)?newAppointmentStatuses:[])])]
    : newAppointmentStatuses;
  const cells=useMemo(()=>{const first=new Date(month.getFullYear(),month.getMonth(),1);const start=new Date(first);start.setDate(1-first.getDay());return Array.from({length:42},(_,i)=>{const date=new Date(start);date.setDate(start.getDate()+i);return date})},[month]);
  function showCreate(date=selected){setRequestId(null);setEditingId(null);setRebooking(false);setForm(initialForm(date));setOpen(true)}
  function showEdit(item:Appointment){setRequestId(null);setEditingId(item.id);setRebooking(item.patientResponse==='RESCHEDULE_REQUESTED');setForm({patientId:item.patientId,date:item.date.slice(0,10),time:item.time.slice(0,5),durationMinutes:String(item.durationMinutes),type:item.type,price:item.price==null?'':String(item.price),status:item.status,notes:item.notes||'',meetingUrl:item.meetingUrl||''});setOpen(true)}
  function approveRequest(item:AppointmentRequest){const time={MORNING:'09:00',AFTERNOON:'14:00',EVENING:'18:00'}[item.preferredPeriod];setRequestId(item.id);setEditingId(null);setRebooking(false);setForm({...initialForm(item.preferredDate),patientId:item.patientId,time,type:item.appointmentType,notes:item.notes||''});setSelected(item.preferredDate);setMonth(new Date(`${item.preferredDate}T12:00:00`));setOpen(true)}
  async function declineRequest(item:AppointmentRequest){if(!(await confirm({title:'Recusar solicitação?',message:`A solicitação de ${item.patientName} será recusada e o paciente será avisado no portal.`,confirmLabel:'Recusar',tone:'warning'})))return;try{await api(`/api/appointments/requests/${item.id}`,{method:'PATCH',body:JSON.stringify({status:'DECLINED'})});setNotice('Solicitação atualizada e paciente notificado no portal.');await load()}catch(cause){setError(cause instanceof Error?cause.message:'Não foi possível atualizar a solicitação.')}}
  async function save(event:FormEvent){
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    const now = new Date();
    const currentHourMin = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const isPastDate = form.date < todayIso;
    const isPastTimeToday = form.date === todayIso && form.time < currentHourMin;

    if (!editingId && (isPastDate || isPastTimeToday)) {
      if (!(await confirm({title:'Registrar consulta retroativa?',message:`O horário selecionado (${form.time} em ${form.date.split('-').reverse().join('/')}) já passou. Confirme apenas se esse registro retroativo for intencional.`,confirmLabel:'Registrar mesmo assim',tone:'warning'}))) {
        setSaving(false);
        return;
      }
    }

    try{
      const payload={patientId:form.patientId,date:form.date,time:form.time,durationMinutes:Number(form.durationMinutes),type:form.type,price:form.price?Number(form.price):undefined,status:form.status,notes:form.notes||undefined,meetingUrl:form.meetingUrl||undefined,...(!editingId&&requestId?{requestId}:{})};
      if(editingId){
        const result=await api<{data:{emailSent:boolean|null;warning?:string|null}}>(`/api/appointments/${editingId}`,{method:'PATCH',body:JSON.stringify(payload)});
        setNotice(result.data.emailSent?'Consulta atualizada e paciente avisado por e-mail e no portal.':result.data.warning||'Consulta atualizada e paciente notificado no portal.')
      }else{
        const result=await api<{data:{emailSent:boolean;warning?:string|null}}>('/api/appointments',{method:'POST',body:JSON.stringify(payload)});
        setNotice(result.data.emailSent?'Consulta criada e confirmação enviada por e-mail.':result.data.warning||'Consulta criada.')
      }
      setOpen(false);
      setRequestId(null);
      setEditingId(null);
      setSelected(form.date);
      await load()
    }catch(cause){
      setError(cause instanceof Error?cause.message:'Não foi possível salvar a consulta.')
    }finally{
      setSaving(false)
    }
  }
  async function updateStatus(item:Appointment,status:AppointmentStatus){try{const result=await api<{data:{emailSent:boolean|null;warning?:string|null}}>(`/api/appointments/${item.id}`,{method:'PATCH',body:JSON.stringify({status})});if(status==='CANCELLED')setNotice(result.data.emailSent?'Consulta cancelada e paciente avisado por e-mail e no portal.':result.data.warning||'Consulta cancelada e paciente notificado no portal.');await load()}catch(cause){setError(cause instanceof Error?cause.message:'Não foi possível alterar o status.')}}
  function getWhatsAppLink(item: Appointment) {
    if (!item.whatsapp) return null;
    const cleanPhone = item.whatsapp.replace(/\D/g, '');
    const fullPhone = cleanPhone.length === 10 || cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
    const isOnline = item.type.toLowerCase().includes('online') || item.type.toLowerCase().includes('tele');
    const dateFormatted = new Date(`${item.date.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR');
    const callUrl = item.meetingUrl || `${window.location.origin}/teleconsulta/${item.id}`;

    const text = isOnline
      ? `Olá, ${item.patientName}! 🎥 Sua teleconsulta nutricional está confirmada para ${dateFormatted} às ${item.time}. Acesse a sala virtual da nossa chamada no link: ${callUrl}. Até já!`
      : `Olá, ${item.patientName}! 🌿 Passando para confirmar sua consulta nutricional agendada para ${dateFormatted} às ${item.time}. Nos vemos em breve!`;

    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
  }

  return <div className="agenda-page"><div className="page-intro agenda-intro"><div><span className="eyebrow">Organização clínica</span><h2>Sua agenda, com o dia sob controle</h2><p>Visualize horários, confirmações e atendimentos sem perder o contexto de cada paciente.</p></div><button className="primary-button" onClick={()=>showCreate()}><Plus size={18}/> Nova consulta</button></div>{error&&<div className="form-error" role="alert">{error}</div>}{notice&&<div className="form-success">{notice}</div>}
    <section className="agenda-summary" aria-label="Resumo da agenda no mês"><article><CalendarDays/><div><small>Consultas no mês</small><strong>{monthStats.total}</strong></div></article><article><Clock3/><div><small>Aguardando atendimento</small><strong>{monthStats.upcoming}</strong></div></article><article><Video/><div><small>Em andamento</small><strong>{monthStats.inProgress}</strong></div></article><article><CalendarCheck2/><div><small>Concluídas</small><strong>{monthStats.completed}</strong></div></article></section>
    {requests.length>0&&<section className="panel appointment-requests agenda-requests"><div className="panel-heading"><div><span className="eyebrow">Solicitações pelo portal</span><h3>Novos pedidos de consulta</h3><p>Revise a preferência do paciente antes de reservar o horário.</p></div><strong>{requests.length}</strong></div><div>{requests.map(item=><article key={item.id}><span className="request-icon"><CalendarDays/></span><div><strong>{item.patientName}</strong><span>{new Date(`${item.preferredDate}T12:00:00`).toLocaleDateString('pt-BR')} · {{MORNING:'Manhã',AFTERNOON:'Tarde',EVENING:'Noite'}[item.preferredPeriod]} · {item.appointmentType}</span>{item.notes&&<small>{item.notes}</small>}</div><div className="request-actions"><button className="secondary-button" onClick={()=>void declineRequest(item)}>Recusar</button><button className="primary-button" onClick={()=>approveRequest(item)}>Agendar</button></div></article>)}</div></section>}
    <div className="agenda-layout"><section className="panel calendar-panel"><div className="calendar-heading"><button className="icon-button" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}><ChevronLeft size={19}/></button><h2>{month.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</h2><button className="icon-button" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}><ChevronRight size={19}/></button></div><div className="calendar-weekdays">{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(day=><span key={day}>{day}</span>)}</div><div className="calendar-grid">{cells.map(date=>{const value=isoDate(date);const count=appointments.filter(a=>a.date.slice(0,10)===value).length;return <button key={value} className={`${date.getMonth()!==month.getMonth()?'outside ':''}${value===selected?'selected ':''}${value===todayIso?'today':''}`} onClick={()=>setSelected(value)}><span>{date.getDate()}</span>{count>0&&<small>{count}</small>}</button>})}</div><div className="calendar-legend"><span><i/> Dia com consulta</span><button className="text-link" onClick={()=>{const now=new Date();setMonth(new Date(now.getFullYear(),now.getMonth(),1));setSelected(todayIso)}}>Ir para hoje</button></div></section>
      <section className="panel day-panel"><div className="panel-heading agenda-day-heading"><div><span className="eyebrow">Agenda do dia</span><h3>{new Date(`${selected}T12:00:00`).toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</h3><p>{appointments.filter(item=>item.date.slice(0,10)===selected).length} compromissos neste dia</p></div><button className="icon-button" onClick={()=>showCreate(selected)} aria-label="Agendar neste dia"><Plus size={20}/></button></div><div className="agenda-toolbar"><label><Search size={16}/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Buscar paciente ou tipo" aria-label="Buscar na agenda do dia"/></label><label><Filter size={15}/><select value={statusFilter} onChange={event=>setStatusFilter(event.target.value as 'ALL'|AppointmentStatus)} aria-label="Filtrar por status"><option value="ALL">Todos os status</option>{Object.entries(statusLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label></div>{loading?<div className="empty-state"><span className="spinner"/><strong>Organizando sua agenda...</strong></div>:selectedItems.length===0?<div className="empty-state"><CalendarDays size={32}/><strong>{search||statusFilter!=='ALL'?'Nenhum resultado encontrado':'Nenhuma consulta neste dia'}</strong><p>{search||statusFilter!=='ALL'?'Ajuste a busca ou remova o filtro para visualizar outros horários.':'Este dia está livre. Você pode reservar um novo horário agora.'}</p>{!search&&statusFilter==='ALL'&&<button className="secondary-button" onClick={()=>showCreate(selected)}><Plus size={17}/> Agendar consulta</button>}</div>:<div className="appointment-list">{selectedItems.map(item=><article className={`appointment-card response-${item.patientResponse.toLowerCase()}`} key={item.id}><div className="appointment-time"><strong title={`${item.time} às ${getEndTime(item.time, item.durationMinutes)}`}>{item.time} às {getEndTime(item.time, item.durationMinutes)}</strong><small>{item.durationMinutes} min</small></div><div className="appointment-info"><strong>{item.patientName}</strong><span>{item.type}</span><small>{item.patientResponse==='RESCHEDULE_REQUESTED'?`Reagendamento solicitado${item.patientResponseNote?`: ${item.patientResponseNote}`:''}`:item.patientResponse==='CONFIRMED'?'Presença confirmada pelo paciente':'Confirmação do paciente pendente'}</small></div><select className={`appointment-status status-${item.status.toLowerCase()}`} value={item.status} onChange={e=>void updateStatus(item,e.target.value as AppointmentStatus)} aria-label={`Status da consulta de ${item.patientName}`}>{statusTransitions[item.status].map(value=><option key={value} value={value}>{statusLabels[value]}</option>)}</select><div className="appointment-actions">{item.patientResponse==='RESCHEDULE_REQUESTED'&&<button className="secondary-button" onClick={()=>showEdit(item)}>Reagendar</button>}{item.whatsapp&&<a className="icon-button appointment-whatsapp" href={getWhatsAppLink(item)!} target="_blank" rel="noreferrer" title="Enviar lembrete pelo WhatsApp"><MessageCircle size={17}/></a>}{item.meetingUrl&&<a className="icon-button" href={item.meetingUrl} target="_blank" rel="noreferrer" title="Abrir teleconsulta"><Video size={17}/></a>}<button className="icon-button" onClick={()=>showEdit(item)} title="Editar consulta"><Clock3 size={17}/></button><Link className="start-care" to={`/atendimentos?paciente=${item.patientId}&agendamento=${item.id}${item.type.toLowerCase().includes('online')?'&video=true':''}`}>Atender <ChevronRight size={16}/></Link></div></article>)}</div>}</section></div>
    {open&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="appointment-title"><div className="modal-heading"><div><span className="eyebrow">Agenda clínica</span><h2 id="appointment-title">{rebooking?'Reagendar consulta':editingId?'Editar consulta':'Nova consulta'}</h2></div><button className="icon-button" onClick={()=>setOpen(false)}><X size={20}/></button></div><form onSubmit={save}><div className="form-grid"><label className="full">Paciente<select value={form.patientId} onChange={e=>setForm({...form,patientId:e.target.value})} required><option value="">Selecione um paciente</option>{patients.map(patient=><option value={patient.id} key={patient.id}>{patient.name}</option>)}</select></label>        <label>
          Data
          <input
            type="date"
            min={!editingId ? todayIso : undefined}
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </label><label>Horário<input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} required/></label><label>Tipo<select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{types.map(type=><option key={type}>{type}</option>)}</select></label><label>Duração<select value={form.durationMinutes} onChange={e=>setForm({...form,durationMinutes:e.target.value})}><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option></select></label><div className="appointment-time-preview"><Clock3 size={16}/><div><small>Horário reservado</small><strong>{form.time} às {getEndTime(form.time, Number(form.durationMinutes) || 60)}</strong><span>{form.durationMinutes} minutos de atendimento</span></div></div><label>Valor (R$)<input type="number" min="0" step="0.01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label><label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value as AppointmentStatus})}>{formStatuses.map(value=><option key={value} value={value}>{statusLabels[value]}</option>)}</select></label>{form.type.toLowerCase().includes('online')&&<label className="full">Link externo da teleconsulta <small className="field-hint">Opcional — a sala interna continua disponível.</small><div className="input-with-icon"><Video size={17}/><input type="url" value={form.meetingUrl} onChange={e=>setForm({...form,meetingUrl:e.target.value})} placeholder="https://..."/></div></label>}<label className="full">Observações <small className="field-hint">Informações internas para preparar o atendimento.</small><textarea rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Ex.: paciente levará exames laboratoriais recentes"/></label></div>{patients.length===0&&<div className="inline-guidance"><UserRound size={18}/><span>Cadastre um paciente antes de criar a consulta.</span><Link to="/pacientes">Ir para pacientes <ExternalLink size={14}/></Link></div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setOpen(false)}>Cancelar</button><button className="primary-button" disabled={saving||patients.length===0}>{saving?'Salvando...':<><Clock3 size={17}/> {rebooking?'Confirmar reagendamento':editingId?'Salvar alterações':'Confirmar consulta'}</>}</button></div></form></section></div>}</div>;
}
