import { api } from './api';

export type SupabaseGuideInstructions = {
  steps?: string[];
  acceptsAccountPassword?: boolean;
  acceptsDatabaseUrl?: boolean;
  external?: boolean;
};
export type SupabaseConnection = { status: string; projectRef: string; projectName: string; organizationSlug: string; region: string };
export type SupabaseGuide = { configured: boolean; mode: 'GUIDED'|'OAUTH'; guide: SupabaseGuideInstructions|null; connection?: SupabaseConnection|null; reference: SupabaseReference | null };
export type SupabaseReference = { projectRef: string; organizationSlug: string; region: string; databaseSecretRef: string; migrationDatabaseSecretRef: string; verified?: boolean };
export type PreviewStatus = 'PENDING'|'VALIDATING_ARTIFACT'|'WAITING_PREVIEW'|'SMOKE_TESTING'|'READY_TO_PROMOTE'|'KNOWN_GOOD'|'FAILED_RETRYABLE'|'FAILED_MANUAL'|'ROLLED_BACK';
export type PreviewState = { id: string; tenantId?: string; status: PreviewStatus; progress: number; deploymentId?: string; url?: string; smokePassed?: boolean; attemptCount?: number; lastErrorCode?: string; stateVersion?: number };
export type SignedPreviewRequest = { jobId: string; idempotencyKey: string; bundle: { manifest: { version: 1; releaseId: string; sourceCommit: string; files: Array<{ path: string; size: number; sha256: string }> }; signature: string; digest: string }; entries: Array<{ path: string; data: string }> };

const vercel = '/api/platform/vercel', supabase = '/api/platform/supabase';
const useMock=import.meta.env.DEV&&import.meta.env.VITE_PLATFORM_USE_MOCK==='true';
const mockPreviews=new Map<string,PreviewState>();
export const platformProvisioningApi = {
  async getSupabase(tenantId: string, signal?: AbortSignal) { if(useMock)return{configured:true,mode:'GUIDED' as const,guide:{external:false},reference:null};return (await api<{data: SupabaseGuide}>(`${supabase}/tenants/${tenantId}`, { signal })).data; },
  async startSupabase(tenantId: string, input: { organizationSlug: string; projectName: string; region: string }) { return (await api<{data:{authorizationUrl:string}}>(`${supabase}/tenants/${tenantId}/start`, { method:'POST', body:JSON.stringify(input) })).data; },
  async revokeSupabase(tenantId: string) { await api(`${supabase}/tenants/${tenantId}`, { method:'DELETE' }); },
  async linkSupabase(tenantId: string, input: SupabaseReference) { if(useMock)return{...input,verified:true};return (await api<{data: SupabaseReference}>(`${supabase}/tenants/${tenantId}/reference`, { method: 'PUT', body: JSON.stringify(input) })).data; },
  async createPreview(tenantId: string, input: SignedPreviewRequest) { if(useMock){const state:PreviewState={id:`fake-${input.idempotencyKey}`,tenantId,status:'WAITING_PREVIEW',progress:60,url:'https://clinica-exemplo-staging.vercel.app'};mockPreviews.set(state.id,state);return{...state}}return (await api<{data: PreviewState}>(`${vercel}/tenants/${tenantId}/previews`, { method: 'POST', body: JSON.stringify(input) })).data; },
  async getPreview(id: string, signal?: AbortSignal) { if(useMock){const state=mockPreviews.get(id);if(!state)throw new Error('Preview fake não encontrado.');return{...state}}return (await api<{data: PreviewState}>(`${vercel}/previews/${id}`, { signal })).data; },
  async reconcilePreview(id: string) { if(useMock){const state={...await this.getPreview(id),status:'SMOKE_TESTING' as const,progress:80};mockPreviews.set(id,state);return state}return (await api<{data: PreviewState}>(`${vercel}/previews/${id}/reconcile`, { method: 'POST' })).data; },
  async smokePreview(id: string) { if(useMock){const state={...await this.getPreview(id),status:'READY_TO_PROMOTE' as const,progress:90,smokePassed:true};mockPreviews.set(id,state);return state}return (await api<{data: PreviewState}>(`${vercel}/previews/${id}/smoke`, { method: 'POST' })).data; },
  async retryPreview(id: string) { if(useMock){const state={...await this.getPreview(id),status:'WAITING_PREVIEW' as const,lastErrorCode:undefined};mockPreviews.set(id,state);return state}return (await api<{data: PreviewState}>(`${vercel}/previews/${id}/retry`, { method: 'POST' })).data; },
  async rollbackPreview(id: string) { if(useMock){const state={...await this.getPreview(id),status:'ROLLED_BACK' as const,progress:100};mockPreviews.set(id,state);return state}return (await api<{data: PreviewState}>(`${vercel}/previews/${id}/rollback`, { method: 'POST' })).data; },
  async waitForPreview(id: string, options: { signal?: AbortSignal; intervalMs?: number; attempts?: number; onProgress?: (state: PreviewState) => void } = {}) {
    const { signal, intervalMs = 1500, attempts = 40, onProgress } = options;
    for (let attempt = 0; attempt < attempts; attempt++) {
      if (signal?.aborted) throw new DOMException('Operação cancelada.', 'AbortError');
      let state = await this.getPreview(id, signal); onProgress?.(state);
      if (state.status === 'WAITING_PREVIEW') state = await this.reconcilePreview(id);
      if (state.status === 'SMOKE_TESTING') state = await this.smokePreview(id);
      onProgress?.(state);
      if (['READY_TO_PROMOTE','KNOWN_GOOD','FAILED_RETRYABLE','FAILED_MANUAL','ROLLED_BACK'].includes(state.status)) return state;
      await new Promise<void>((resolve, reject) => { const timer = window.setTimeout(resolve, intervalMs); signal?.addEventListener('abort', () => { window.clearTimeout(timer); reject(new DOMException('Operação cancelada.', 'AbortError')); }, { once: true }); });
    }
    throw new Error('O preview continua em processamento. Atualize o status em alguns instantes.');
  },
};
