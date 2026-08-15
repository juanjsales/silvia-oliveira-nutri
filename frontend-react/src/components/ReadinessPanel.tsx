import { AlertTriangle, CheckCircle2, RefreshCw, ServerCog } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

type Check = { key:string; label:string; ready:boolean; required:boolean; detail:string };
type Readiness = { ready:boolean; checks:Check[] };

export function ReadinessPanel() {
  const [data,setData]=useState<Readiness|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const load=useCallback(async()=>{setLoading(true);setError('');try{setData((await api<{data:Readiness}>('/api/settings/readiness')).data)}catch(c){setError(c instanceof Error?c.message:'Não foi possível verificar o sistema.')}finally{setLoading(false)}},[]);
  useEffect(()=>{void load()},[load]);
  return <section className="panel settings-section readiness-panel"><header><ServerCog/><div><h2>Prontidão da plataforma</h2><p>Verificação segura das integrações necessárias para operar em produção.</p></div><button type="button" className="icon-button" onClick={()=>void load()} disabled={loading} aria-label="Verificar novamente"><RefreshCw className={loading?'spin':''}/></button></header>{error&&<div className="form-error">{error}</div>}{data&&<><div className={`readiness-summary ${data.ready?'ready':'attention'}`}>{data.ready?<CheckCircle2/>:<AlertTriangle/>}<div><strong>{data.ready?'Sistema pronto para atendimento':'Configuração incompleta'}</strong><span>{data.ready?'Os recursos essenciais estão disponíveis.':'Corrija os itens obrigatórios antes de atender pacientes.'}</span></div></div><div className="readiness-grid">{data.checks.map(check=><article key={check.key} className={check.ready?'ready':'missing'}>{check.ready?<CheckCircle2/>:<AlertTriangle/>}<div><strong>{check.label}</strong><span>{check.detail}</span>{!check.required&&<small>Recomendado</small>}</div></article>)}</div></>}</section>;
}
