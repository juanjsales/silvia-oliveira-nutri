import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertTriangle, ArrowLeft, Check, CheckCircle2, ChevronRight, Circle,
  Cloud, Database, LoaderCircle, LockKeyhole, Palette, RefreshCw, Rocket,
  RotateCcw, ShieldCheck, Stethoscope, Undo2, XCircle, Leaf,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import {
  platformOnboardingApi, type Activity, type OnboardingState, type OnboardingStep,
} from '../lib/platformOnboardingApi';
import { VercelProvisioningPanel } from '../components/platform/VercelProvisioningPanel';
import { SupabaseGuidedStep } from '../components/platform/SupabaseGuidedStep';
import { ClinicDeliveryPanel } from '../components/platform/ClinicDeliveryPanel';
import '../platform.css';

const steps: { id: OnboardingStep; label: string; icon: typeof Cloud }[] = [
  { id: 'CLINIC', label: 'Clínica', icon: Stethoscope },
  { id: 'VERCEL', label: 'Vercel', icon: Cloud },
  { id: 'SUPABASE', label: 'Supabase', icon: Database },
  { id: 'IDENTITY', label: 'Identidade', icon: Palette },
  { id: 'REVIEW', label: 'Revisão', icon: CheckCircle2 },
  { id: 'PUBLISH', label: 'Publicação', icon: Rocket },
];

export function PlatformOnboardingPage() {
  const { tenantId = '' } = useParams();
  const [state, setState] = useState<OnboardingState | null>(null);
  const [selected, setSelected] = useState<OnboardingStep>('CLINIC');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try { const next = await platformOnboardingApi.get(tenantId); setState(next); setSelected(next.currentStep); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o onboarding.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [tenantId]);

  async function act(fn: () => Promise<OnboardingState>) {
    setBusy(true); setError('');
    try { const next = await fn(); setState(next); setSelected(next.currentStep); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a etapa.'); }
    finally { setBusy(false); }
  }

  if (loading) return <main className="onboarding-page"><div className="vercel-loading" role="status"><LoaderCircle />Carregando onboarding…</div></main>;
  if (error && !state) return <main className="onboarding-page"><div className="platform-state"><AlertTriangle /><h1>Onboarding indisponível</h1><p>{error}</p><button className="platform-primary" onClick={load}><RefreshCw />Tentar novamente</button></div></main>;
  if (!state) return null;
  if (!state.configured) return <BootstrapOnboarding tenantId={tenantId} busy={busy} error={error} onSubmit={async values=>{setBusy(true);setError('');try{await platformOnboardingApi.initialize(tenantId,values);await load()}catch(cause){setError(cause instanceof Error?cause.message:'Não foi possível preparar o onboarding.')}finally{setBusy(false)}}}/>;

  return <main className="onboarding-page"><div className="onboarding-brandmark"><span><Leaf/></span><strong>KOS <i>NUTRI</i></strong></div>
    <header className="onboarding-header">
      <Link to={`/plataforma/tenants/${tenantId}`} className="platform-back"><ArrowLeft />Voltar ao tenant</Link>
      <div className="onboarding-safety"><ShieldCheck /><span><strong>Provisionamento protegido</strong><small>As ações externas exigem autorização e passam por preview, validação e confirmação.</small></span></div>
      <span className="platform-eyebrow">Provisionamento guiado</span>
      <h1>Preparar nova clínica</h1>
      <p>Conclua e verifique cada etapa antes de autorizar uma publicação real.</p>
      <div className="onboarding-progress"><progress max="100" value={state.overallProgress} aria-label="Progresso total" /><strong>{state.overallProgress}%</strong></div>
    </header>
    <OnboardingDiagnostics state={state} />
    <div className="onboarding-layout">
      <nav aria-label="Etapas do onboarding">{steps.map(({ id, label, icon: Icon }) => {
        const status = state.steps[id], locked = status === 'LOCKED';
        return <button key={id} disabled={locked} aria-current={selected === id ? 'step' : undefined} onClick={() => setSelected(id)}>
          <span className={`onboarding-step-icon ${status.toLowerCase()}`}>{status === 'COMPLETED' ? <Check /> : <Icon />}</span>
          <span><strong>{label}</strong><small>{status === 'COMPLETED' ? 'Concluído' : status === 'FAILED' ? 'Requer atenção' : locked ? 'Bloqueado' : 'Em andamento'}</small></span><ChevronRight />
        </button>;
      })}</nav>
      <section className="platform-panel onboarding-card">
        <Step state={state} selected={selected} busy={busy} act={act} />
        {error && <div className="onboarding-inline-error" role="alert"><AlertTriangle/><span><strong>Não foi possível concluir esta ação</strong><small>{error}</small></span><button type="button" className="platform-secondary" onClick={() => { setError(''); void load(); }}><RefreshCw/>Atualizar diagnóstico</button></div>}
      </section>
    </div>
  </main>;
}

function OnboardingDiagnostics({ state }: { state: OnboardingState }) {
  const identityReady = Boolean(state.identity.brandName && state.identity.ownerEmail);
  const publicationReady = state.publication.status === 'READY';
  const items = [
    { label: 'Hospedagem', ready: state.vercel.connected, detail: state.vercel.connected ? state.vercel.projectName : 'Aguardando autorização' },
    { label: 'Banco exclusivo', ready: state.supabase.verified, detail: state.supabase.verified ? state.supabase.projectRef : 'Aguardando verificação' },
    { label: 'Identidade', ready: identityReady, detail: identityReady ? state.identity.brandName : 'Aguardando configuração' },
    { label: 'Publicação', ready: publicationReady, detail: publicationReady ? 'Versão validada' : state.publication.status === 'FAILED' ? 'Requer atenção' : 'Ainda não liberada', failed: state.publication.status === 'FAILED' },
  ];
  return <section className="onboarding-diagnostics" aria-labelledby="onboarding-diagnostics-title"><header><div><span className="platform-eyebrow">Diagnóstico da instalação</span><h2 id="onboarding-diagnostics-title">O que já está pronto</h2></div><small aria-live="polite">{items.filter(item => item.ready).length} de {items.length} verificações concluídas</small></header><div>{items.map(item => <article key={item.label} className={item.failed ? 'is-failed' : item.ready ? 'is-ready' : 'is-pending'}><span aria-hidden="true">{item.failed ? <AlertTriangle/> : item.ready ? <Check/> : <Circle/>}</span><div><strong>{item.label}</strong><small>{item.detail}</small></div><em>{item.failed ? 'Atenção' : item.ready ? 'Pronto' : 'Pendente'}</em></article>)}</div></section>;
}

function BootstrapOnboarding({tenantId,busy,error,onSubmit}:{tenantId:string;busy:boolean;error:string;onSubmit:(values:{clinicName:string;professionalName:string;contactEmail:string;ownerName:string;ownerEmail:string})=>Promise<void>}){
  const[values,setValues]=useState({clinicName:'',professionalName:'',contactEmail:'',ownerName:'',ownerEmail:''});
  return <main className="onboarding-page"><Link to={`/plataforma/tenants/${tenantId}`} className="platform-back"><ArrowLeft/>Voltar ao tenant</Link><header className="onboarding-header"><div className="onboarding-safety"><ShieldCheck/><span><strong>Preparação segura</strong><small>Nenhum projeto externo será criado nesta etapa.</small></span></div><span className="platform-eyebrow">Primeiro passo</span><h1>Preparar onboarding</h1><p>Identifique a clínica e sua responsável para abrir o fluxo guiado.</p></header><section className="platform-panel onboarding-card"><form className="onboarding-form" onSubmit={event=>{event.preventDefault();void onSubmit(values)}}><h2>Responsáveis pela instalação</h2><p>Use dados administrativos. Não informe pacientes ou conteúdo clínico.</p>{([['clinicName','Nome da clínica','text'],['professionalName','Nome da nutricionista','text'],['contactEmail','E-mail administrativo','email'],['ownerName','Nome da proprietária','text'],['ownerEmail','E-mail da proprietária','email']] as const).map(([key,label,type])=><label key={key}>{label}<input required type={type} value={values[key]} onChange={event=>setValues({...values,[key]:event.target.value})}/></label>)}{error&&<div className="platform-form-error" role="alert">{error}</div>}<button className="platform-primary" disabled={busy}>{busy?<><LoaderCircle className="activity-spinner"/>Preparando…</>:<>Preparar fluxo<ChevronRight/></>}</button></form></section></main>
}

function Step({ state, selected, busy, act }: { state: OnboardingState; selected: OnboardingStep; busy: boolean; act: (fn: () => Promise<OnboardingState>) => Promise<void> }) {
  if (selected === 'CLINIC') return <SimpleForm title="Dados da clínica" description="Somente informações administrativas." fields={[["name", "Nome da clínica", state.clinic.name, "text"], ["contactEmail", "E-mail responsável", state.clinic.contactEmail, "email"]]} busy={busy} submit={v => act(() => platformOnboardingApi.save(state.tenantId, 'CLINIC', { name: v.name, contactEmail: v.contactEmail }))} />;
  if (selected === 'VERCEL') return <div className="onboarding-provider-step"><div className="onboarding-provider-intro"><span className="platform-eyebrow">Configuração acompanhada</span><h2>Coloque a clínica no ar</h2><p>Siga uma ação por vez. O sistema sugere o endereço, verifica a disponibilidade e cria a hospedagem automaticamente.</p></div><VercelProvisioningPanel tenantId={state.tenantId} clinicName={state.clinic.name} currentProjectName={state.vercel.projectName} onProjectReady={projectName => act(() => platformOnboardingApi.save(state.tenantId, 'VERCEL', { projectName }))}/></div>;
  if (selected === 'SUPABASE') return <SupabaseGuidedStep state={state} busy={busy} act={act}/>;
  if (selected === 'IDENTITY') return <SimpleForm title="Identidade da clínica" description="Defina a marca apresentada à equipe e aos pacientes." fields={[["brandName", "Nome da marca", state.identity.brandName, "text"], ["primaryColor", "Cor principal", state.identity.primaryColor, "color"], ["ownerEmail", "E-mail da proprietária", state.identity.ownerEmail, "email"]]} busy={busy} submit={v => act(() => platformOnboardingApi.save(state.tenantId, 'IDENTITY', { brandName: v.brandName, primaryColor: v.primaryColor, ownerEmail: v.ownerEmail }))} />;
  if (selected === 'REVIEW') return <div className="onboarding-review"><span className="platform-eyebrow">Checklist final</span><h2>Revisão antes de publicar</h2><p>Confira os destinos que receberão a instalação. A confirmação libera apenas a criação do ambiente de pré-visualização; a entrega definitiva depende dos testes de funcionamento.</p><dl><div><dt>Clínica</dt><dd>{state.clinic.name}</dd></div><div><dt>Hospedagem</dt><dd>{state.vercel.projectName || 'Aguardando projeto'}</dd></div><div><dt>Banco exclusivo</dt><dd>{state.supabase.projectRef ? `${state.supabase.projectRef} · ${state.supabase.region}` : 'Aguardando verificação'}</dd></div><div><dt>Identidade</dt><dd>{state.identity.brandName}</dd></div></dl><aside className="onboarding-promotion-lock"><ShieldCheck/><span><strong>Sem dados clínicos nesta etapa</strong><small>Use somente dados administrativos e uma base vazia. Pacientes reais entram apenas depois da entrega validada.</small></span></aside><button className="platform-primary" disabled={busy} onClick={() => act(() => platformOnboardingApi.save(state.tenantId, 'REVIEW', {}))}><CheckCircle2 />Confirmar e liberar pré-visualização</button></div>;
  return <PublishPanel state={state} busy={busy} act={act} />;
}

function ActivityIcon({ item }: { item: Activity }) {
  if (item.status === 'RUNNING') return <LoaderCircle className="activity-spinner" />;
  if (item.status === 'SUCCEEDED') return <CheckCircle2 />;
  if (item.status === 'FAILED') return <XCircle />;
  if (item.status === 'ROLLED_BACK') return <Undo2 />;
  return <Circle />;
}

function PublishPanel({ state, busy, act }: { state: OnboardingState; busy: boolean; act: (fn: () => Promise<OnboardingState>) => Promise<void> }) {
  const publication = state.publication;
  const isReady = publication.status === 'READY';
  const isFailed = publication.status === 'FAILED';
  const isRolledBack = publication.status === 'ROLLED_BACK';
  return <div className="onboarding-publish">
    <div className="onboarding-publish-heading"><span><Rocket /></span><div><small>PUBLICAÇÃO ASSISTIDA</small><h2>{isReady ? 'Site publicado e validado' : isFailed ? 'Recuperação necessária' : isRolledBack ? 'Versão anterior restaurada' : 'Preparar, validar e publicar'}</h2><p>{publication.message || 'O sistema cria um preview isolado, valida o funcionamento e só então libera a publicação.'}</p></div></div>
    <div className="onboarding-promotion-lock"><LockKeyhole /><span><strong>Publicação com controle de segurança</strong><small>Nenhum preview é promovido sem integridade do artefato, smoke aprovado e confirmação do fluxo.</small></span></div>
    {busy && <div className="onboarding-running" role="status"><LoaderCircle /><span><strong>Executando validações protegidas…</strong><small>Preparação → artefato → ambiente → preview → smoke → publicação.</small></span></div>}
    <ol className="onboarding-activity" aria-label="Progresso da publicação">{state.activity.map((item, index) => <li key={item.id} className={`is-${item.status.toLowerCase()}`}><span className="onboarding-activity-index"><ActivityIcon item={item} /></span><div><span>Etapa {index + 1}</span><strong>{item.label}</strong><small>{item.detail}</small></div><em>{item.status === 'SUCCEEDED' ? 'Aprovada' : item.status === 'FAILED' ? 'Falhou' : item.status === 'ROLLED_BACK' ? 'Revertida' : item.status === 'RUNNING' ? 'Executando' : 'Pendente'}</em></li>)}</ol>
    {isFailed && <aside className="onboarding-recovery" role="alert"><AlertTriangle /><div><strong>Falha contida com segurança</strong><p>Revise a etapa indicada e retome do mesmo ponto. As etapas aprovadas são preservadas; eventuais recursos incompletos permanecem isolados da produção.</p></div></aside>}
    {isReady && publication.url && <div className="onboarding-preview-result"><CheckCircle2 /><span><strong>Site validado disponível</strong><a href={publication.url} target="_blank" rel="noreferrer">{publication.url}</a></span></div>}
    {isReady && <ClinicDeliveryPanel tenantId={state.tenantId} ownerEmail={state.identity.ownerEmail} previewUrl={publication.url} />}
    {isRolledBack && <aside className="onboarding-recovery is-safe"><ShieldCheck /><div><strong>Estado seguro restaurado</strong><p>O preview e o smoke foram revertidos. Configuração e dados permaneceram preservados.</p></div></aside>}
    <div className="onboarding-actions">
      {!isReady && !isFailed && <button className="platform-primary" disabled={busy} onClick={() => act(() => platformOnboardingApi.publish(state.tenantId))}><Rocket />{busy ? 'Publicando…' : isRolledBack ? 'Publicar nova versão' : 'Validar e publicar'}</button>}
      {isFailed && <button className="platform-primary" disabled={busy} onClick={() => act(() => platformOnboardingApi.retry(state.tenantId))}><RefreshCw />Retomar da falha</button>}
      {(isReady || isFailed) && <button className="platform-secondary" disabled={busy} onClick={() => act(() => platformOnboardingApi.rollback(state.tenantId))}><RotateCcw />Restaurar versão segura</button>}
    </div>
  </div>;
}

function SimpleForm({ title, description, fields, busy, submit }: { title: string; description: string; fields: string[][]; busy: boolean; submit: (values: Record<string, string>) => void }) {
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(fields.map(field => [field[0], field[2]])));
  function send(event: FormEvent) { event.preventDefault(); submit(values); }
  return <form className="onboarding-form" onSubmit={send}><h2>{title}</h2><p>{description}</p>{fields.map(([key, label, , type]) => <label key={key}>{label}<input required type={type} value={values[key] ?? ''} onChange={event => setValues({ ...values, [key]: event.target.value })} /></label>)}<button className="platform-primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar e continuar'}<ChevronRight /></button></form>;
}
