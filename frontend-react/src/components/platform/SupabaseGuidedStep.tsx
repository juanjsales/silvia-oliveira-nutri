import { useState, type FormEvent } from 'react';
import { CheckCircle2, ChevronRight, ExternalLink, KeyRound, ShieldCheck } from 'lucide-react';
import type { OnboardingState } from '../../lib/platformOnboardingApi';
import { platformOnboardingApi } from '../../lib/platformOnboardingApi';
import { platformProvisioningApi } from '../../lib/platformProvisioningApi';
import './SupabaseGuidedStep.css';

type Props = {
  state: OnboardingState;
  busy: boolean;
  act: (operation: () => Promise<OnboardingState>) => Promise<void>;
};

const regions = [
  { value: 'sa-east-1', label: 'São Paulo (recomendado para o Brasil)' },
  { value: 'us-east-1', label: 'Leste dos Estados Unidos' },
  { value: 'eu-west-1', label: 'Oeste da Europa' },
];

export function SupabaseGuidedStep({ state, busy, act }: Props) {
  const [values, setValues] = useState({
    projectRef: state.supabase.projectRef,
    organizationSlug: '',
    region: state.supabase.region,
    databaseSecretRef: `vault://tenant/${state.tenantId}/database-url`,
    migrationDatabaseSecretRef: `vault://tenant/${state.tenantId}/migration-database-url`,
  });
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState('');
  const succeeded = feedback.startsWith('Tudo certo');

  function update(key: keyof typeof values, value: string) {
    setValues(current => ({ ...current, [key]: value.trim() }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setWorking(true);
    setFeedback('');
    try {
      await platformProvisioningApi.linkSupabase(state.tenantId, values);
      setFeedback('Tudo certo: projeto e referências verificados. Concluindo a etapa…');
      await act(() => platformOnboardingApi.save(state.tenantId, 'SUPABASE', {
        projectRef: values.projectRef,
        region: values.region,
      }));
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : 'Não foi possível verificar as referências. Confira os dados e tente novamente.');
    } finally {
      setWorking(false);
    }
  }

  return <form className="onboarding-form supabase-guide" onSubmit={submit}>
    <header className="supabase-guide__header">
      <span><ShieldCheck /></span>
      <div><small>CONEXÃO SEGURA, SEM SENHAS</small><h2>Conectar o banco da clínica</h2><p>Você fará três passos. Esta tela recebe somente identificadores públicos e endereços internos do cofre.</p></div>
    </header>

    <ol className="supabase-guide__steps">
      <li><span>1</span><div><strong>Abra ou crie o projeto</strong><p>Use a conta da clínica e um projeto exclusivo para ela.</p><a href="https://supabase.com/dashboard/projects" target="_blank" rel="noreferrer">Abrir painel do Supabase <ExternalLink /></a></div></li>
      <li><span>2</span><div><strong>Copie os identificadores</strong><p>No painel, copie a referência do projeto e o identificador da organização. Eles não são senhas.</p></div></li>
      <li><span>3</span><div><strong>Confirme o cofre</strong><p>Um administrador deve salvar as conexões no cofre indicado abaixo. Não cole URLs ou senhas aqui.</p></div></li>
    </ol>

    <fieldset>
      <legend>Identificação do projeto</legend>
      <label htmlFor="supabase-project-ref">Referência do projeto <small>Exemplo: abcdefghijklmnopqrst</small></label>
      <input id="supabase-project-ref" required minLength={6} maxLength={40} autoComplete="off" value={values.projectRef} onChange={event => update('projectRef', event.target.value)} />
      <label htmlFor="supabase-organization">Identificador da organização</label>
      <input id="supabase-organization" required autoComplete="off" value={values.organizationSlug} onChange={event => update('organizationSlug', event.target.value)} />
      <label htmlFor="supabase-region">Região do projeto</label>
      <select id="supabase-region" required value={values.region} onChange={event => update('region', event.target.value)}>{regions.map(region => <option key={region.value} value={region.value}>{region.label}</option>)}</select>
    </fieldset>

    <fieldset className="supabase-guide__vault">
      <legend><KeyRound /> Referências do cofre</legend>
      <p>Os endereços já foram preparados para esta clínica. Apenas confirme com a pessoa responsável pela infraestrutura que os dois segredos foram cadastrados.</p>
      <label htmlFor="supabase-runtime-ref">Conexão usada pela aplicação</label>
      <input id="supabase-runtime-ref" required readOnly value={values.databaseSecretRef} />
      <label htmlFor="supabase-migration-ref">Conexão usada nas atualizações</label>
      <input id="supabase-migration-ref" required readOnly value={values.migrationDatabaseSecretRef} />
    </fieldset>

    <aside className="supabase-guide__warning"><ShieldCheck /><p><strong>Nunca informe nesta tela:</strong> senha da conta, senha do banco, chave service role ou URL iniciada por postgres://.</p></aside>
    {feedback && <div className={succeeded ? 'platform-form-success' : 'platform-form-error'} role={succeeded ? 'status' : 'alert'}>{succeeded && <CheckCircle2 />}{feedback}</div>}
    <button className="platform-primary" disabled={busy || working}>{working ? 'Verificando com segurança…' : 'Verificar projeto e continuar'}<ChevronRight /></button>
  </form>;
}
