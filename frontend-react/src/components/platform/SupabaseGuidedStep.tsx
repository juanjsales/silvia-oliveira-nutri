import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Check, CheckCircle2, ChevronRight, Clipboard, Database, ExternalLink, KeyRound, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import type { OnboardingState } from '../../lib/platformOnboardingApi';
import { platformOnboardingApi } from '../../lib/platformOnboardingApi';
import { platformProvisioningApi, type SupabaseGuide, type SupabaseReference } from '../../lib/platformProvisioningApi';
import './SupabaseGuidedStep.css';

type Props = { state: OnboardingState; busy: boolean; act: (operation: () => Promise<OnboardingState>) => Promise<void> };
const regions = [
  { value: 'sa-east-1', label: 'São Paulo (recomendado para o Brasil)' },
  { value: 'us-east-1', label: 'Leste dos Estados Unidos' },
  { value: 'eu-west-1', label: 'Oeste da Europa' },
];
const makeReferences = (tenantId: string) => ({ databaseSecretRef: `vault://tenant/${tenantId}/database-url`, migrationDatabaseSecretRef: `vault://tenant/${tenantId}/migration-database-url` });

export function SupabaseGuidedStep({ state, busy, act }: Props) {
  const defaults = useMemo(() => makeReferences(state.tenantId), [state.tenantId]);
  const [guide, setGuide] = useState<SupabaseGuide | null>(null);
  const [values, setValues] = useState<SupabaseReference>({ projectRef: state.supabase.projectRef, organizationSlug: '', region: state.supabase.region, ...defaults });
  const [loading, setLoading] = useState(true), [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState(''), [copied, setCopied] = useState('');
  const popupRef = useRef<Window|null>(null);
  const succeeded = feedback.startsWith('Tudo certo');

  async function load(signal?: AbortSignal) {
    setLoading(true); setFeedback('');
    try { const next = await platformProvisioningApi.getSupabase(state.tenantId, signal); setGuide(next); if (next.reference) setValues(next.reference); }
    catch (cause) { if ((cause as Error).name !== 'AbortError') setFeedback(cause instanceof Error ? cause.message : 'Não foi possível carregar a configuração do banco.'); }
    finally { if (!signal?.aborted) setLoading(false); }
  }
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [state.tenantId]);
  useEffect(() => { const receive = (event:MessageEvent) => { const data=event.data;if(event.origin!==window.location.origin||event.source!==popupRef.current||!data||data.type!=='nutri:supabase-oauth'||data.tenantId!==state.tenantId)return;popupRef.current?.close();popupRef.current=null;if(data.status==='success'){setFeedback('Tudo certo: o banco exclusivo foi criado e conectado. Atualizando…');void load()}else setFeedback('A autorização não foi concluída. Tente novamente.');};window.addEventListener('message',receive);return()=>{window.removeEventListener('message',receive);popupRef.current?.close()}},[state.tenantId]);
  function update(key: keyof SupabaseReference, value: string) { setValues(current => ({ ...current, [key]: key === 'region' ? value : value.trim().toLowerCase() })); }
  async function copy(value: string, label: string) { await navigator.clipboard.writeText(value); setCopied(label); window.setTimeout(() => setCopied(''), 1800); }
  async function submit(event: FormEvent) {
    event.preventDefault(); setWorking(true); setFeedback('');
    try {
      const linked = await platformProvisioningApi.linkSupabase(state.tenantId, values); setValues(linked);
      setFeedback('Tudo certo: o projeto foi verificado e vinculado à clínica. Avançando…');
      await act(() => platformOnboardingApi.save(state.tenantId, 'SUPABASE', { projectRef: linked.projectRef, region: linked.region }));
    } catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Não foi possível verificar o projeto. Confira os dados e tente novamente.'); }
    finally { setWorking(false); }
  }
  async function authorize(){setWorking(true);setFeedback('');try{const result=await platformProvisioningApi.startSupabase(state.tenantId,{organizationSlug:values.organizationSlug,projectName:state.clinic.name,region:values.region}),popup=window.open(result.authorizationUrl,'supabase-connect','popup,width=620,height=780');if(!popup)throw new Error('Permita pop-ups para abrir a autorização segura do Supabase.');popupRef.current=popup;setFeedback('Conclua a autorização na janela do Supabase. Esta tela será atualizada automaticamente.')}catch(cause){setFeedback(cause instanceof Error?cause.message:'Não foi possível abrir a autorização.')}finally{setWorking(false)}}

  if (loading) return <div className="supabase-guide__loading" role="status"><LoaderCircle/><span><strong>Preparando conexão segura…</strong><small>Consultando o estado salvo desta clínica.</small></span></div>;
  return <form className="onboarding-form supabase-guide" onSubmit={submit}>
    <header className="supabase-guide__header"><span><Database /></span><div><small>BANCO EXCLUSIVO DA CLÍNICA</small><h2>Conectar o Supabase</h2><p>A conta e os dados continuam pertencendo à nutricionista. A central guarda somente identificadores públicos e referências protegidas.</p></div></header>
    <div className="supabase-guide__mode"><ShieldCheck/><span><strong>{guide?.mode==='OAUTH'?'Conexão automática autorizada':'Conexão guiada'}</strong><small>{guide?.mode==='OAUTH'?'Uma janela oficial do Supabase cria e conecta o projeto; a central nunca recebe sua senha.':'A autorização automática ainda não está habilitada. Você não precisará informar senha nesta tela.'}</small></span></div>
    {guide?.mode==='OAUTH' && !guide.connection && <section className="supabase-guide__oauth"><h3>Criar o banco automaticamente</h3><p>Informe apenas o identificador público da organização. Ao continuar, entre na conta da clínica e autorize a criação do projeto exclusivo.</p><label htmlFor="supabase-oauth-organization">Organização no Supabase</label><input id="supabase-oauth-organization" required minLength={2} maxLength={80} value={values.organizationSlug} onChange={event=>update('organizationSlug',event.target.value)}/><label htmlFor="supabase-oauth-region">Região</label><select id="supabase-oauth-region" value={values.region} onChange={event=>update('region',event.target.value)}>{regions.map(region=><option key={region.value} value={region.value}>{region.label}</option>)}</select><button type="button" className="platform-primary" disabled={working||values.organizationSlug.length<2} onClick={()=>void authorize()}><ExternalLink/>{working?'Preparando autorização…':'Autorizar e criar banco'}</button></section>}
    {guide?.mode==='OAUTH' && guide.connection && <div className="platform-form-success" role="status"><CheckCircle2/><span><strong>Banco conectado</strong><small>{guide.connection.projectName} · {guide.connection.region}</small></span></div>}
    {guide?.mode==='OAUTH' ? null : <>
    <ol className="supabase-guide__steps">
      <li className="is-current"><span>1</span><div><strong>Abra o painel na conta da clínica</strong><p>Crie um projeto vazio e exclusivo. O plano e a cobrança, quando houver, ficam com a proprietária.</p><a href="https://supabase.com/dashboard/new" target="_blank" rel="noreferrer">Criar projeto no Supabase <ExternalLink /></a></div></li>
      <li><span>2</span><div><strong>Copie dois identificadores públicos</strong><p>A referência aparece nas configurações do projeto; a organização aparece no endereço do painel.</p></div></li>
      <li><span>3</span><div><strong>Confirme e avance</strong><p>A central valida o vínculo antes de liberar identidade, revisão e publicação.</p></div></li>
    </ol>
    <fieldset><legend>Identificação do projeto</legend>
      <label htmlFor="supabase-project-ref">Referência do projeto <small>6 a 40 letras, números ou hífens</small></label><input id="supabase-project-ref" required minLength={6} maxLength={40} autoComplete="off" spellCheck={false} placeholder="abcdefghijklmnopqrst" value={values.projectRef} onChange={event => update('projectRef', event.target.value)} />
      <label htmlFor="supabase-organization">Identificador da organização <small>não é o nome exibido</small></label><input id="supabase-organization" required minLength={2} maxLength={80} autoComplete="off" spellCheck={false} placeholder="minha-clinica" value={values.organizationSlug} onChange={event => update('organizationSlug', event.target.value)} />
      <label htmlFor="supabase-region">Região do projeto</label><select id="supabase-region" required value={values.region} onChange={event => update('region', event.target.value)}>{regions.map(region => <option key={region.value} value={region.value}>{region.label}</option>)}</select>
    </fieldset>
    <fieldset className="supabase-guide__vault"><legend><KeyRound /> Destinos protegidos preparados</legend><p>Estes nomes dizem ao servidor onde encontrar as conexões. Eles não contêm senha nem acesso ao banco.</p>
      {([['Conexão da aplicação', values.databaseSecretRef], ['Conexão de atualizações', values.migrationDatabaseSecretRef]] as const).map(([label, value]) => <div className="supabase-guide__secret" key={label}><span><small>{label}</small><code>{value}</code></span><button type="button" aria-label={`Copiar ${label}`} onClick={() => void copy(value, label)}>{copied === label ? <Check/> : <Clipboard/>}{copied === label ? 'Copiado' : 'Copiar'}</button></div>)}
    </fieldset>
    <aside className="supabase-guide__warning"><ShieldCheck /><p><strong>Nunca informe aqui:</strong> senha da conta, senha do banco, chave service role ou URL iniciada por postgres://. Esses dados devem ser armazenados diretamente no ambiente protegido.</p></aside>
    {guide?.reference?.verified && <div className="platform-form-success" role="status"><CheckCircle2/>Este projeto já foi verificado. Você pode confirmar novamente para continuar.</div>}
    {feedback && <div className={succeeded ? 'platform-form-success' : 'platform-form-error'} role={succeeded ? 'status' : 'alert'}>{succeeded && <CheckCircle2 />}{feedback}</div>}
    </>}
    <div className="supabase-guide__actions"><button type="button" className="platform-secondary" disabled={working} onClick={() => void load()}><RefreshCw/>Atualizar estado</button>{guide?.mode==='GUIDED'&&<button className="platform-primary" disabled={busy || working}>{working ? <><LoaderCircle className="activity-spinner"/>Verificando…</> : <>Verificar e continuar<ChevronRight /></>}</button>}{guide?.mode==='OAUTH'&&guide.reference?.verified&&<button type="button" className="platform-primary" disabled={busy||working} onClick={()=>void act(()=>platformOnboardingApi.save(state.tenantId,'SUPABASE',{projectRef:guide.reference!.projectRef,region:guide.reference!.region}))}>Continuar<ChevronRight/></button>}</div>
  </form>;
}
