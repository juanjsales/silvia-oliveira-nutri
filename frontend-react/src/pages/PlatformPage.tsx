import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowLeft, Building2, CheckCircle2, ChevronRight, Clock3, Cloud, Database, LogOut, RefreshCw, Search, ServerCog, ShieldCheck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { platformApi, type JobStatus, type TenantDetail, type TenantStatus, type TenantSummary } from '../lib/platformApi';
import '../platform.css';

const tenantStatus: Record<TenantStatus, string> = {
  DRAFT: 'Rascunho', PROVISIONING: 'Provisionando', AWAITING_ACCEPTANCE: 'Aguardando aceite', ACTIVE: 'Ativo',
  SUSPENDED: 'Suspenso', OFFBOARDING: 'Encerrando', ARCHIVED: 'Arquivado'
};
const jobStatus: Record<JobStatus, string> = {
  PENDING: 'Pendente', RUNNING: 'Em execução', WAITING_INPUT: 'Aguardando dado', WAITING_APPROVAL: 'Aguardando aprovação',
  FAILED_RETRYABLE: 'Falha recuperável', FAILED_MANUAL: 'Revisão manual', CANCELLED: 'Cancelado', SUCCEEDED: 'Concluído'
};
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Em andamento';

function StatusBadge({ status }: { status: TenantStatus }) {
  return <span className={`platform-badge platform-badge--${status.toLowerCase()}`}>{tenantStatus[status]}</span>;
}

function PlatformFrame({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  async function signOut() { await logout(); navigate('/login', { replace: true }); }
  return <div className="platform-root">
    <header className="platform-topbar">
      <a href="/plataforma" className="platform-brand"><span><ServerCog /></span><div><strong>Central da Plataforma</strong><small>Ambiente local de produto</small></div></a>
      <div className="platform-operator"><div><strong>{user?.name || 'Operador local'}</strong><small>Administração da plataforma</small></div><button type="button" onClick={signOut} aria-label="Sair"><LogOut /></button></div>
    </header>
    <main className="platform-main">{children}</main>
  </div>;
}

function LoadingState() {
  return <div className="platform-loading" role="status" aria-live="polite"><div className="platform-skeleton platform-skeleton--title"/><div className="platform-skeleton-grid">{[1,2,3].map(i=><div className="platform-skeleton platform-skeleton--card" key={i}/>)}</div><span>Carregando tenants…</span></div>;
}

function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return <section className="platform-state" role="alert"><span className="platform-state-icon platform-state-icon--error"><AlertTriangle /></span><h2>Não foi possível carregar a central</h2><p>{message}</p><button className="platform-primary" type="button" onClick={retry}><RefreshCw /> Tentar novamente</button></section>;
}

export function PlatformPage() {
  const [items, setItems] = useState<TenantSummary[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [query, setQuery] = useState(''); const [reload, setReload] = useState(0);
  useEffect(() => { const controller = new AbortController(); setLoading(true); setError(''); platformApi.listTenants(controller.signal).then(setItems).catch(err => { if (err?.name !== 'AbortError') setError(err instanceof Error ? err.message : 'Erro inesperado.'); }).finally(() => { if (!controller.signal.aborted) setLoading(false); }); return () => controller.abort(); }, [reload]);
  const filtered = useMemo(() => items.filter(item => `${item.displayName} ${item.slug}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
  const active = items.filter(item => item.status === 'ACTIVE').length; const attention = items.filter(item => item.health === 'attention' || item.status === 'AWAITING_ACCEPTANCE').length;
  return <PlatformFrame>{loading ? <LoadingState /> : error ? <ErrorState message={error} retry={() => setReload(value => value + 1)} /> : <>
    <section className="platform-heading"><div><span className="platform-eyebrow">Control plane · dados fictícios</span><h1>Tenants</h1><p>Acompanhe instalações, saúde técnica e jobs sem acessar dados clínicos.</p></div><button className="platform-primary" type="button" disabled title="Criação disponível em uma próxima etapa"><Building2 /> Novo tenant</button></section>
    <section className="platform-metrics" aria-label="Resumo dos tenants"><article><span><Building2 /></span><div><small>Total</small><strong>{items.length}</strong></div></article><article><span><CheckCircle2 /></span><div><small>Ativos</small><strong>{active}</strong></div></article><article><span><Clock3 /></span><div><small>Em implantação</small><strong>{items.filter(i=>i.status==='PROVISIONING').length}</strong></div></article><article><span><AlertTriangle /></span><div><small>Pedem atenção</small><strong>{attention}</strong></div></article></section>
    {items.length === 0 ? <section className="platform-state"><span className="platform-state-icon"><Building2 /></span><h2>Nenhum tenant por aqui</h2><p>O primeiro tenant aparecerá depois que seu cadastro assistido for iniciado.</p><small>Modo mock vazio ativo. Nenhum recurso externo foi criado.</small></section> : <section className="platform-panel"><div className="platform-panel-head"><div><h2>Instalações</h2><span>{filtered.length} de {items.length}</span></div><label className="platform-search"><Search /><span className="sr-only">Buscar tenant</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar por nome ou identificador" /></label></div>
      {filtered.length === 0 ? <div className="platform-no-results"><Search /><strong>Nenhum resultado</strong><span>Revise o termo da busca.</span></div> : <div className="platform-tenant-list">{filtered.map(item=><a className="platform-tenant-row" href={`/plataforma/tenants/${item.id}`} key={item.id}><div className="platform-tenant-avatar">{item.displayName.slice(0,2).toUpperCase()}</div><div className="platform-tenant-name"><strong>{item.displayName}</strong><span>{item.slug}</span></div><StatusBadge status={item.status}/><div className="platform-tenant-meta"><small>Plano</small><span>{item.plan}</span></div><div className="platform-tenant-meta"><small>Release</small><span>{item.appVersion || '—'}</span></div><div className={`platform-health platform-health--${item.health}`}><i />{item.health === 'healthy' ? 'Saudável' : item.health === 'attention' ? 'Atenção' : 'Não verificado'}</div><ChevronRight className="platform-chevron" /></a>)}</div>}
    </section>}
  </>}</PlatformFrame>;
}

export function PlatformTenantPage() {
  const { tenantId = '' } = useParams(); const [tenant, setTenant] = useState<TenantDetail | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [reload, setReload] = useState(0);
  useEffect(() => { const controller = new AbortController(); setLoading(true); setError(''); platformApi.getTenant(tenantId, controller.signal).then(setTenant).catch(err => { if(err?.name!=='AbortError') setError(err instanceof Error ? err.message : 'Erro inesperado.'); }).finally(()=>{if(!controller.signal.aborted)setLoading(false)}); return()=>controller.abort(); }, [tenantId, reload]);
  return <PlatformFrame>{loading ? <LoadingState /> : error || !tenant ? <ErrorState message={error || 'Tenant não encontrado.'} retry={()=>setReload(v=>v+1)} /> : <>
    <a className="platform-back" href="/plataforma"><ArrowLeft /> Voltar aos tenants</a>
    <section className="platform-detail-heading"><div className="platform-tenant-avatar platform-tenant-avatar--large">{tenant.displayName.slice(0,2).toUpperCase()}</div><div><span className="platform-eyebrow">{tenant.slug}</span><h1>{tenant.displayName}</h1><p>{tenant.contact.name} · {tenant.contact.email}</p></div><StatusBadge status={tenant.status}/></section>
    <section className="platform-detail-grid"><article className="platform-panel platform-overview"><div className="platform-panel-head"><div><h2>Visão técnica</h2><span>Somente metadados permitidos</span></div><ShieldCheck /></div><dl><div><dt>Domínio</dt><dd>{tenant.domain || 'Não configurado'}</dd></div><div><dt>Região</dt><dd>{tenant.region}</dd></div><div><dt>Release</dt><dd>{tenant.appVersion || 'Não publicada'}</dd></div><div><dt>Schema</dt><dd>{tenant.schemaVersion ?? '—'}</dd></div><div><dt>Plano</dt><dd>{tenant.plan}</dd></div><div><dt>Última atualização</dt><dd>{formatDate(tenant.updatedAt)}</dd></div></dl></article>
      <article className="platform-panel platform-resources"><div className="platform-panel-head"><div><h2>Recursos vinculados</h2><span>Referências mock locais</span></div><Cloud /></div>{tenant.resources.map(resource=><div className="platform-resource" key={resource.provider}><span>{resource.provider==='Supabase'?<Database/>:<Cloud/>}</span><div><strong>{resource.provider}</strong><small>{resource.label}</small></div><i className={resource.status}>{resource.status==='verified'?'Verificado':'Pendente'}</i></div>)}</article>
    </section>
    <section className="platform-panel platform-jobs"><div className="platform-panel-head"><div><h2>Jobs e histórico</h2><span>{tenant.jobs.length} {tenant.jobs.length===1?'operação':'operações'}</span></div><Activity /></div>{tenant.jobs.length===0?<div className="platform-no-results"><Clock3/><strong>Nenhum job registrado</strong><span>As operações aparecerão aqui.</span></div>:<div className="platform-timeline">{tenant.jobs.map(job=><article key={job.id}><span className={`platform-job-dot platform-job-dot--${job.status.toLowerCase()}`}>{job.status==='SUCCEEDED'?<CheckCircle2/>:<Clock3/>}</span><div><div className="platform-job-title"><strong>{job.kind==='INITIAL_PROVISION'?'Provisionamento inicial':job.kind==='UPDATE'?'Atualização':'Reconciliação'}</strong><span className={`platform-job-status platform-job-status--${job.status.toLowerCase()}`}>{jobStatus[job.status]}</span></div><p>{job.summary}</p><small>{job.phase} · release {job.release} · tentativa {job.attempt}</small></div><time>{formatDate(job.finishedAt || job.startedAt)}</time></article>)}</div>}</section>
  </>}</PlatformFrame>;
}
