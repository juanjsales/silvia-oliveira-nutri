export type TenantStatus = 'DRAFT' | 'PROVISIONING' | 'AWAITING_ACCEPTANCE' | 'ACTIVE' | 'SUSPENDED' | 'OFFBOARDING' | 'ARCHIVED';
export type JobStatus = 'PENDING' | 'RUNNING' | 'WAITING_INPUT' | 'WAITING_APPROVAL' | 'FAILED_RETRYABLE' | 'FAILED_MANUAL' | 'CANCELLED' | 'SUCCEEDED';
export type JobKind = 'INITIAL_PROVISION' | 'UPDATE' | 'RECONCILE';

export type TenantSummary = {
  id: string;
  displayName: string;
  slug: string;
  status: TenantStatus;
  plan: string;
  region: string;
  appVersion: string | null;
  health: 'healthy' | 'attention' | 'unknown';
  updatedAt: string;
};

export type ProvisioningJob = {
  id: string;
  kind: JobKind;
  phase: string;
  status: JobStatus;
  attempt: number;
  release: string;
  startedAt: string;
  finishedAt: string | null;
  summary: string;
};

export type TenantDetail = TenantSummary & {
  contact: { name: string; email: string };
  domain: string | null;
  schemaVersion: number | null;
  resources: Array<{ provider: 'Supabase' | 'Vercel'; label: string; status: 'verified' | 'pending' }>;
  jobs: ProvisioningJob[];
};

export interface PlatformApiClient {
  listTenants(signal?: AbortSignal): Promise<TenantSummary[]>;
  getTenant(tenantId: string, signal?: AbortSignal): Promise<TenantDetail>;
}

const tenants: TenantDetail[] = [
  {
    id: 'tenant-aurora', displayName: 'Clínica Aurora', slug: 'clinica-aurora-a19c', status: 'ACTIVE', plan: 'Profissional',
    region: 'São Paulo', appVersion: '1.0.0', health: 'healthy', updatedAt: '2026-08-27T13:42:00Z',
    contact: { name: 'Marina Costa', email: 'marina@example.test' }, domain: 'aurora.example.test', schemaVersion: 45,
    resources: [{ provider: 'Supabase', label: 'aurora-hml', status: 'verified' }, { provider: 'Vercel', label: 'aurora-app', status: 'verified' }],
    jobs: [
      { id: 'job-a2', kind: 'UPDATE', phase: 'COMPLETED', status: 'SUCCEEDED', attempt: 1, release: '1.0.0', startedAt: '2026-08-27T13:36:00Z', finishedAt: '2026-08-27T13:42:00Z', summary: 'Release validada e promovida.' },
      { id: 'job-a1', kind: 'INITIAL_PROVISION', phase: 'COMPLETED', status: 'SUCCEEDED', attempt: 1, release: '0.9.0', startedAt: '2026-08-20T14:10:00Z', finishedAt: '2026-08-20T14:24:00Z', summary: 'Provisionamento inicial concluído.' }
    ]
  },
  {
    id: 'tenant-horizonte', displayName: 'Nutri Horizonte', slug: 'nutri-horizonte-75fe', status: 'PROVISIONING', plan: 'Essencial',
    region: 'São Paulo', appVersion: null, health: 'unknown', updatedAt: '2026-08-27T14:08:00Z',
    contact: { name: 'Paula Nunes', email: 'paula@example.test' }, domain: null, schemaVersion: 45,
    resources: [{ provider: 'Supabase', label: 'horizonte-hml', status: 'verified' }, { provider: 'Vercel', label: 'Aguardando vínculo', status: 'pending' }],
    jobs: [
      { id: 'job-h1', kind: 'INITIAL_PROVISION', phase: 'PROVISIONING_APP', status: 'WAITING_INPUT', attempt: 1, release: '1.0.0', startedAt: '2026-08-27T14:01:00Z', finishedAt: null, summary: 'Aguardando referência do projeto Vercel.' }
    ]
  },
  {
    id: 'tenant-sereno', displayName: 'Espaço Sereno', slug: 'espaco-sereno-3bc1', status: 'AWAITING_ACCEPTANCE', plan: 'Profissional',
    region: 'São Paulo', appVersion: '1.0.0', health: 'attention', updatedAt: '2026-08-27T12:18:00Z',
    contact: { name: 'Renata Lima', email: 'renata@example.test' }, domain: 'sereno.example.test', schemaVersion: 45,
    resources: [{ provider: 'Supabase', label: 'sereno-hml', status: 'verified' }, { provider: 'Vercel', label: 'sereno-app', status: 'verified' }],
    jobs: [
      { id: 'job-s1', kind: 'INITIAL_PROVISION', phase: 'AWAITING_ACCEPTANCE', status: 'WAITING_APPROVAL', attempt: 1, release: '1.0.0', startedAt: '2026-08-27T11:52:00Z', finishedAt: null, summary: 'Gates técnicos concluídos; aceite pendente.' }
    ]
  }
];

const wait = (signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  const timer = window.setTimeout(resolve, 420);
  signal?.addEventListener('abort', () => { window.clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
});

function mockMode() {
  return new URLSearchParams(window.location.search).get('mockState');
}

export const localPlatformApi: PlatformApiClient = {
  async listTenants(signal) {
    await wait(signal);
    if (mockMode() === 'error') throw new Error('A central local não respondeu. Tente novamente.');
    if (mockMode() === 'empty') return [];
    return tenants.map(({ contact: _contact, domain: _domain, schemaVersion: _schema, resources: _resources, jobs: _jobs, ...summary }) => summary);
  },
  async getTenant(tenantId, signal) {
    await wait(signal);
    if (mockMode() === 'error') throw new Error('Não foi possível carregar este tenant.');
    const tenant = tenants.find(item => item.id === tenantId);
    if (!tenant) throw new Error('Tenant não encontrado.');
    return tenant;
  }
};

export const platformApi: PlatformApiClient = localPlatformApi;
