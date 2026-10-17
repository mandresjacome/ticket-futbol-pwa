import { z } from 'zod';

// El servidor hace peticiones al endpoint de la suscripción: solo se aceptan los servicios de push conocidos.
const PUSH_HOST_SUFFIXES = [
  'fcm.googleapis.com',
  'push.services.mozilla.com',
  'push.apple.com',
  'notify.windows.com',
];

export const subscriptionSchema = z.object({
  endpoint: z
    .url()
    .max(2048)
    .refine((value) => {
      const url = new URL(value);
      return (
        url.protocol === 'https:' &&
        PUSH_HOST_SUFFIXES.some((suffix) => url.hostname === suffix || url.hostname.endsWith(`.${suffix}`))
      );
    }, 'Servicio de notificaciones no permitido'),
  keys: z.object({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(64),
  }),
});

export const unsubscribeSchema = z.object({ endpoint: z.url().max(2048) });
