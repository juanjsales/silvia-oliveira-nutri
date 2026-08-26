import webpush from 'web-push';
import type { Pool, PoolClient } from 'pg';

const vapidConfigured = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);

export function getVapidPublicKey(): string | null {
  return vapidConfigured ? process.env.VAPID_PUBLIC_KEY! : null;
}

if (vapidConfigured) {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
  } catch {
    console.warn('[WebPush] Configuração VAPID inválida; notificações do dispositivo permanecerão desativadas.');
  }
}

export type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: Record<string, unknown>;
  tag?: string;
};

/**
 * Dispara notificação push para todos os dispositivos cadastrados de um paciente.
 * Caso um dispositivo tenha revogado a permissão (HTTP 404/410), a assinatura é removida automaticamente.
 */
export async function sendPushToPatient(
  db: Pool | PoolClient,
  patientId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  if (!vapidConfigured) return { sent: 0, failed: 0 };
  try {
    const result = await db.query<{ id: string; endpoint: string; p256dh: string; auth: string }>(
      `SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE patient_id = $1`,
      [patientId]
    );

    if (result.rows.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const jsonPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/favicon.svg',
      badge: payload.badge || '/favicon.svg',
      url: payload.url || '/portal',
      tag: payload.tag || 'nutri-notification',
      data: {
        url: payload.url || '/portal',
        ...(payload.data || {}),
      },
    });

    let sent = 0;
    let failed = 0;

    await Promise.all(
      result.rows.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            jsonPayload,
            {
              TTL: 60 * 60 * 24, // 24 horas
            }
          );
          sent++;
        } catch (error: any) {
          failed++;
          // Se o endpoint retornou 404 (Not Found) ou 410 (Gone), a inscrição expirou
          if (error.statusCode === 404 || error.statusCode === 410) {
            await db.query(`DELETE FROM push_subscriptions WHERE id = $1`, [sub.id]).catch(() => {});
          }
        }
      })
    );

    return { sent, failed };
  } catch (err) {
    console.error('[WebPush] Erro ao processar envio para paciente:', err);
    return { sent: 0, failed: 0 };
  }
}
