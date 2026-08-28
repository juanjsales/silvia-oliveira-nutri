import { api } from './api';

export type OwnerInvitationRelease = {
  id: string;
  ownerEmail: string;
  expiresAt: string;
};

export interface PlatformDeliveryApi {
  releaseOwnerInvitation(tenantId: string): Promise<OwnerInvitationRelease>;
}

const remoteDeliveryApi: PlatformDeliveryApi = {
  async releaseOwnerInvitation(tenantId) {
    return (await api<{ data: OwnerInvitationRelease }>(`/api/platform/tenants/${tenantId}/owner-invitation/release`, { method: 'POST' })).data;
  },
};

const localDeliveryApi: PlatformDeliveryApi = {
  async releaseOwnerInvitation() {
    await new Promise<void>(resolve => window.setTimeout(resolve, 350));
    return {
      id: crypto.randomUUID(),
      ownerEmail: 'owner@example.test',
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    };
  },
};

export const platformDeliveryApi = import.meta.env.DEV && import.meta.env.VITE_PLATFORM_USE_MOCK === 'true'
  ? localDeliveryApi
  : remoteDeliveryApi;
