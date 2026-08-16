import { ClipboardList, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

type Checkin={id:string;patientId:string;patientName:string;submittedAt:string;appointmentDate?:string;appointmentTime?:string;answers:{mainDifficulty?:string;adherence?:number}};
export function PendingCheckinsPanel(){
 const[items,setItems]=useState<Checkin[]>([]);
 useEffect(()=>{api<{data:Checkin[]}>('/api/encounters/checkins/pending').then(r=>setItems(r.data)).catch(()=>setItems([]))},[]);
 if(!items.length)return null;
 return <section className="panel span-two"><div className="panel-heading"><div><span className="eyebrow">Antes da consulta</span><h3>Check-ins aguardando revisão</h3></div><strong>{items.length} pendente(s)</strong></div><div className="pending-checkins">{items.map(item=><article key={item.id}><ClipboardList/><div><strong>{item.patientName}</strong><span>{item.appointmentDate?`Consulta em ${new Date(`${item.appointmentDate}T12:00`).toLocaleDateString('pt-BR')} ${String(item.appointmentTime||'').slice(0,5)}`:`Enviado em ${new Date(item.submittedAt).toLocaleDateString('pt-BR')}`}</span><small>{item.answers.mainDifficulty||'Sem dificuldade principal informada'}{item.answers.adherence!==undefined?` · Adesão ${item.answers.adherence}/10`:''}</small></div><Link className="secondary-button" to={`/pacientes/${item.patientId}/clinico`}>Abrir paciente <ArrowRight/></Link></article>)}</div></section>
}
