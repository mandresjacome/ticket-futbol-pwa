import 'server-only';
import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export class PushConfigError extends Error {}

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new PushConfigError('Faltan NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY o VAPID_SUBJECT');
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

// Envía a todos los dispositivos del usuario y elimina los que el servicio de push ya no reconoce.
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; removed: number }> {
  configureWebPush();
  const admin = createAdminClient();

  const { data: subscriptions, error } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);
  if (error) {
    throw new Error(`No se pudieron leer las suscripciones: ${error.message}`);
  }
  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, removed: 0 };
  }

  const body = JSON.stringify(payload);
  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint as string, keys: { p256dh: sub.p256dh as string, auth: sub.auth as string } },
        body,
        { TTL: 60 * 60 }
      )
    )
  );

  const expiredIds: string[] = [];
  let sent = 0;
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      sent += 1;
      return;
    }
    const statusCode = (result.reason as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      expiredIds.push(subscriptions[index].id as string);
    } else {
      console.error('push send failed', statusCode, result.reason);
    }
  });

  if (expiredIds.length > 0) {
    await admin.from('push_subscriptions').delete().in('id', expiredIds);
  }
  return { sent, removed: expiredIds.length };
}
