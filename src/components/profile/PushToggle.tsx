'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type PushState = 'loading' | 'unsupported' | 'ios-install' | 'missing-key' | 'denied' | 'off' | 'on';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export const PushToggle: React.FC = () => {
  const [state, setState] = useState<PushState>('loading');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const detect = useCallback(async () => {
    if (!PUBLIC_KEY) return setState('missing-key');

    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    if (!supported) return setState(isIos() ? 'ios-install' : 'unsupported');
    if (Notification.permission === 'denied') return setState('denied');

    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    const subscription = await registration?.pushManager.getSubscription();
    setState(subscription ? 'on' : 'off');
  }, []);

  useEffect(() => {
    detect().catch(() => setState('unsupported'));
  }, [detect]);

  const enable = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off');
        return;
      }

      await navigator.serviceWorker.register('/sw.js');
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY as string) as BufferSource,
      });

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) {
        await subscription.unsubscribe();
        throw new Error('subscribe failed');
      }
      setState('on');
    } catch {
      setMessage('No se pudieron activar las notificaciones. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setState('off');
    } catch {
      setMessage('No se pudieron desactivar las notificaciones.');
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/push/test', { method: 'POST' });
      const result = (await response.json()) as { ok: boolean; error?: string };
      setMessage(result.ok ? 'Prueba enviada. Debería llegarte en unos segundos.' : result.error ?? 'No se pudo enviar la prueba.');
    } catch {
      setMessage('No se pudo enviar la prueba.');
    } finally {
      setBusy(false);
    }
  };

  const hints: Partial<Record<PushState, string>> = {
    unsupported: 'Este navegador no admite notificaciones push.',
    'ios-install':
      'En iPhone, primero instala la app: toca Compartir y luego "Agregar a pantalla de inicio". Después ábrela desde allí y activa las notificaciones.',
    'missing-key': 'Las notificaciones no están configuradas todavía.',
    denied: 'Bloqueaste las notificaciones. Habilítalas en los ajustes del navegador para este sitio.',
  };

  return (
    <Card className="mb-3">
      <div className="flex items-start gap-3">
        <BellRing className="mt-0.5 text-primary-600" size={20} />
        <div className="flex-1">
          <div className="font-medium text-gray-900">Alertas en este dispositivo</div>
          <p className="mt-0.5 text-xs text-gray-600">
            Recibe avisos cuando tus selecciones se cumplan o cambien de estado.
          </p>

          {hints[state] && <p className="mt-2 text-xs text-gray-700">{hints[state]}</p>}

          {state === 'off' && (
            <div className="mt-3">
              <Button size="sm" onClick={enable} disabled={busy}>
                Activar notificaciones
              </Button>
            </div>
          )}
          {state === 'on' && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={sendTest} disabled={busy}>
                Enviar prueba
              </Button>
              <Button size="sm" variant="ghost" onClick={disable} disabled={busy}>
                Desactivar
              </Button>
            </div>
          )}

          {message && <p role="status" className="mt-2 text-xs text-gray-700">{message}</p>}
        </div>
      </div>
    </Card>
  );
};
