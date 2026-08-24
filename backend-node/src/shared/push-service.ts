import webpush from 'web-push';
import type { Pool, PoolClient } from 'pg';

// Chaves VAPID estáveis para o consultório da Dra. Silvia
const DEFAULT_VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || 'BMx4R9tG9LzYpW9k_K7XvN2q_5fW5V_8Q3T1j7m9c5B1k4V8X6Z9Y2Q1m8W7k5Z3b9V4X8Q2m7W9k4V8X6Z9Y2Q';
const DEFAULT_VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '1A8f9X2m7W9k4V8X6Z9Y2Q1m8W7k5Z3b9V4X8Q2m7W8';
const DEFAULT_VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contato@silviaoliveiranutri.com.br';

export function getVapidPublicKey(): string {
  return process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC;
}

try {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || DEFAULT_VAPID_SUBJECT,
    getVapidPublicKey(),
    process.env.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE
  );
} catch (err) {
  console.warn('[WebPush] Falha ao configurar VAPID:', err);
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
