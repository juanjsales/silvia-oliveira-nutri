import { api } from './api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getPushPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

export async function isSubscribedToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

export async function subscribeToPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: 'Notificações push não são suportadas neste navegador ou dispositivo.' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        error: permission === 'denied'
          ? 'Permissão de notificação bloqueada no navegador. Habilite nas configurações do site para receber alertas.'
          : 'Permissão não concedida.',
      };
    }

    const { data } = await api<{ data: { publicKey: string } }>('/api/portal/push/vapid-key');
    if (!data?.publicKey) {
      return { success: false, error: 'Chave pública de notificação não encontrada no servidor.' };
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(data.publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as ArrayBuffer,
      });
    }

    const rawSub = subscription.toJSON();
    if (!rawSub.endpoint || !rawSub.keys?.p256dh || !rawSub.keys?.auth) {
      return { success: false, error: 'Falha ao obter credenciais de inscrição do dispositivo.' };
    }

    await api('/api/portal/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: rawSub.endpoint,
        keys: {
          p256dh: rawSub.keys.p256dh,
          auth: rawSub.keys.auth,
        },
        userAgent: navigator.userAgent,
      }),
    });

    return { success: true };
  } catch (err) {
    console.error('[Push] Erro ao inscrever:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Não foi possível ativar as notificações push.',
    };
  }
}

export async function unsubscribeFromPush(): Promise<{ success: boolean }> {
  if (!isPushSupported()) return { success: true };

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await api('/api/portal/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ endpoint }),
      }).catch(() => {});
    }
    return { success: true };
  } catch {
    return { success: false };
  }
}
