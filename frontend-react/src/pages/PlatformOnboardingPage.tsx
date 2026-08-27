import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertTriangle, ArrowLeft, Check, CheckCircle2, ChevronRight, Circle,
  Cloud, Database, LoaderCircle, LockKeyhole, Palette, RefreshCw, Rocket,
  RotateCcw, ShieldCheck, Stethoscope, Undo2, XCircle,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import {
  platformOnboardingApi, type Activity, type OnboardingState, type OnboardingStep,
} from '../lib/platformOnboardingApi';
import { platformProvisioningApi } from '../lib/platformProvisioningApi';
import { VercelProvisioningPanel } from '../components/platform/VercelProvisioningPanel';
import '../platform.css';

const steps: { id: OnboardingStep; label: string; icon: typeof Cloud }[] = [
  { id: 'CLINIC', label: 'Clínica', icon: Stethoscope },
  { id: 'VERCEL', label: 'Vercel', icon: Cloud },
  { id: 'SUPABASE', label: 'Supabase', icon: Database },
  { id: 'IDENTITY', label: 'Identidade', icon: Palette },
  { id: 'REVIEW', label: 'Revisão', icon: CheckCircle2 },
  { id: 'PUBLISH', label: 'Simulação', icon: Rocket },
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
  if (!state.configured) return <main className="onboarding-page"><Link to={`/plataforma/tenants/${tenantId}`} className="platform-back"><ArrowLeft />Voltar ao tenant</Link><section className="platform-state"><AlertTriangle /><h1>Onboarding ainda não configurado</h1><p>{state.message}</p><small>O fluxo permanece bloqueado de forma segura. Procure a administração técnica.</small></section></main>;

  return <main className="onboarding-page">
    <header className="onboarding-header">
      <Link to={`/plataforma/tenants/${tenantId}`} className="platform-back"><ArrowLeft />Voltar ao tenant</Link>
      <div className="onboarding-safety"><ShieldCheck /><span><strong>Ambiente de simulação protegido</strong><small>Sem serviços externos, dados reais ou promoção para produção.</small></span></div>
      <span className="platform-eyebrow">Provisionamento guiado</span>
      <h1>Preparar nova clínica</h1>
      <p>Conclua e verifique cada etapa antes de autorizar uma publicação real.</p>
      <div className="onboarding-progress"><progress max="100" value={state.overallProgress} aria-label="Progresso total" /><strong>{state.overallProgress}%</strong></div>
    </header>
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
        {error && <div className="platform-form-error" role="alert">{error}</div>}
      </section>
    </div>
  </main>;
}

function Step({ state, selected, busy, act }: { state: OnboardingState; selected: OnboardingStep; busy: boolean; act: (fn: () => Promise<OnboardingState>) => Promise<void> }) {
  if (selected === 'CLINIC') return <SimpleForm title="Dados da clínica" description="Somente informações administrativas." fields={[["name", "Nome da clínica", state.clinic.name, "text"], ["contactEmail", "E-mail responsável", state.clinic.contactEmail, "email"]]} busy={busy} submit={v => act(() => platformOnboardingApi.save(state.tenantId, 'CLINIC', { name: v.name, contactEmail: v.contactEmail }))} />;
  if (selected === 'VERCEL') return <div className="onboarding-provider-step"><div className="onboarding-provider-intro"><h2>Hospedagem Vercel</h2><p>Autorize a conta, valide o nome e crie apenas o projeto de preview. Depois confirme o vínculo abaixo.</p></div><VercelProvisioningPanel tenantId={state.tenantId}/><SimpleForm title="Confirmar projeto vinculado" description="Use exatamente o nome verificado no painel acima." fields={[["projectName", "Nome do projeto", state.vercel.projectName, "text"]]} busy={busy} submit={v => act(() => platformOnboardingApi.save(state.tenantId, 'VERCEL', { projectName: v.projectName }))}/></div>;
  if (selected === 'SUPABASE') return <SupabaseGuidedStep state={state} busy={busy} act={act}/>;
  if (selected === 'IDENTITY') return <SimpleForm title="Identidade da clínica" description="Defina a marca apresentada à equipe e aos pacientes." fields={[["brandName", "Nome da marca", state.identity.brandName, "text"], ["primaryColor", "Cor principal", state.identity.primaryColor, "color"], ["ownerEmail", "E-mail da proprietária", state.identity.ownerEmail, "email"]]} busy={busy} submit={v => act(() => platformOnboardingApi.save(state.tenantId, 'IDENTITY', { brandName: v.brandName, primaryColor: v.primaryColor, ownerEmail: v.ownerEmail }))} />;
  if (selected === 'REVIEW') return <div className="onboarding-review"><h2>Revisão antes de simular</h2><p>Confirme que nenhum dado clínico foi utilizado.</p><dl><div><dt>Clínica</dt><dd>{state.clinic.name}</dd></div><div><dt>Vercel</dt><dd>{state.vercel.projectName}</dd></div><div><dt>Supabase</dt><dd>{state.supabase.projectRef} · {state.supabase.region}</dd></div><div><dt>Identidade</dt><dd>{state.identity.brandName}</dd></div></dl><button className="platform-primary" disabled={busy} onClick={() => act(() => platformOnboardingApi.save(state.tenantId, 'REVIEW', {}))}><CheckCircle2 />Confirmar revisão</button></div>;
  return <PublishPanel state={state} busy={busy} act={act} />;
}

function SupabaseGuidedStep({state,busy,act}:{state:OnboardingState;busy:boolean;act:(fn:()=>Promise<OnboardingState>)=>Promise<void>}) {
  const [values,setValues]=useState({projectRef:state.supabase.projectRef,organizationSlug:'',region:state.supabase.region,databaseSecretRef:`vault://tenant/${state.tenantId}/database-url`,migrationDatabaseSecretRef:`vault://tenant/${state.tenantId}/migration-database-url`});
  const [working,setWorking]=useState(false),[feedback,setFeedback]=useState('');
  async function submit(event:FormEvent){event.preventDefault();setWorking(true);setFeedback('');try{await platformProvisioningApi.linkSupabase(state.tenantId,values);setFeedback('Referências verificadas. Concluindo a etapa…');await act(()=>platformOnboardingApi.save(state.tenantId,'SUPABASE',{projectRef:values.projectRef,region:values.region}));}catch(cause){setFeedback(cause instanceof Error?cause.message:'Não foi possível verificar as referências.')}finally{setWorking(false)}}
  return <form className="onboarding-form onboarding-supabase" onSubmit={submit}><h2>Supabase guiado</h2><p>Crie o projeto na conta da clínica e informe somente referências do cofre. Senhas e URLs de banco nunca são aceitas nesta tela.</p><div className="onboarding-guide-callout"><ShieldCheck/><span><strong>Configuração por referência segura</strong><small>As duas referências precisam pertencer a este tenant.</small></span></div>{([['projectRef','Referência pública do projeto'],['organizationSlug','Organização'],['region','Região'],['databaseSecretRef','Referência da conexão da aplicação'],['migrationDatabaseSecretRef','Referência da conexão de migração']] as const).map(([key,label])=><label key={key}>{label}<input required value={values[key]} onChange={event=>setValues({...values,[key]:event.target.value})}/></label>)}{feedback&&<div className={feedback.startsWith('Referências')?'platform-form-success':'platform-form-error'} role="status">{feedback}</div>}<button className="platform-primary" disabled={busy||working}>{working?'Verificando…':'Verificar e continuar'}<ChevronRight/></button></form>;
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
    <div className="onboarding-publish-heading"><span><Rocket /></span><div><small>SIMULAÇÃO PONTA A PONTA</small><h2>{isReady ? 'Preview validado' : isFailed ? 'Recuperação necessária' : isRolledBack ? 'Rollback concluído' : 'Preparar, validar e testar'}</h2><p>{publication.message || 'A simulação percorre todos os gates localmente, sem criar recursos externos.'}</p></div></div>
    <div className="onboarding-promotion-lock"><LockKeyhole /><span><strong>Promoção para produção desativada</strong><small>Este fluxo termina no preview fake e nunca altera a clínica real.</small></span></div>
    {busy && <div className="onboarding-running" role="status"><LoaderCircle /><span><strong>Executando gates protegidos…</strong><small>Preparação → artefato → referências → preview → smoke.</small></span></div>}
    <ol className="onboarding-activity" aria-label="Progresso da simulação">{state.activity.map((item, index) => <li key={item.id} className={`is-${item.status.toLowerCase()}`}><span className="onboarding-activity-index"><ActivityIcon item={item} /></span><div><span>Etapa {index + 1}</span><strong>{item.label}</strong><small>{item.detail}</small></div><em>{item.status === 'SUCCEEDED' ? 'Aprovada' : item.status === 'FAILED' ? 'Falhou' : item.status === 'ROLLED_BACK' ? 'Revertida' : item.status === 'RUNNING' ? 'Executando' : 'Pendente'}</em></li>)}</ol>
    {isFailed && <aside className="onboarding-recovery" role="alert"><AlertTriangle /><div><strong>Falha isolada com segurança</strong><p>Revise a etapa indicada e retome do mesmo ponto. Etapas aprovadas não serão repetidas e nenhum recurso externo foi modificado.</p></div></aside>}
    {isReady && publication.url && <div className="onboarding-preview-result"><CheckCircle2 /><span><strong>Preview fake disponível</strong><a href={publication.url} target="_blank" rel="noreferrer">{publication.url}</a></span></div>}
    {isRolledBack && <aside className="onboarding-recovery is-safe"><ShieldCheck /><div><strong>Estado seguro restaurado</strong><p>O preview e o smoke foram revertidos. Configuração e dados permaneceram preservados.</p></div></aside>}
    <div className="onboarding-actions">
      {!isReady && !isFailed && <button className="platform-primary" disabled={busy} onClick={() => act(() => platformOnboardingApi.publish(state.tenantId))}><Rocket />{busy ? 'Simulando…' : isRolledBack ? 'Executar nova simulação' : 'Executar simulação completa'}</button>}
      {isFailed && <button className="platform-primary" disabled={busy} onClick={() => act(() => platformOnboardingApi.retry(state.tenantId))}><RefreshCw />Retomar da falha</button>}
      {(isReady || isFailed) && <button className="platform-secondary" disabled={busy} onClick={() => act(() => platformOnboardingApi.rollback(state.tenantId))}><RotateCcw />Executar rollback fake</button>}
    </div>
  </div>;
}

function SimpleForm({ title, description, fields, busy, submit }: { title: string; description: string; fields: string[][]; busy: boolean; submit: (values: Record<string, string>) => void }) {
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(fields.map(field => [field[0], field[2]])));
  function send(event: FormEvent) { event.preventDefault(); submit(values); }
  return <form className="onboarding-form" onSubmit={send}><h2>{title}</h2><p>{description}</p>{fields.map(([key, label, , type]) => <label key={key}>{label}<input required type={type} value={values[key] ?? ''} onChange={event => setValues({ ...values, [key]: event.target.value })} /></label>)}<button className="platform-primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar e continuar'}<ChevronRight /></button></form>;
}
