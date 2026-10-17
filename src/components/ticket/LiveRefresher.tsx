'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const POLL_MS = 60_000;

type RefreshResponse = { ok: boolean; updated?: boolean; active?: boolean };

// Pide al servidor actualizar los marcadores y recarga los datos de la página solo si algo cambió.
export const LiveRefresher: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(run, POLL_MS);
    };

    async function run() {
      if (cancelled) return;
      if (document.visibilityState !== 'visible') {
        schedule();
        return;
      }
      try {
        const response = await fetch('/api/tracking/refresh', { method: 'POST' });
        const result = (await response.json()) as RefreshResponse;
        if (cancelled) return;
        if (result.ok && result.updated) router.refresh();
        if (result.ok && result.active) schedule();
      } catch {
        // Sin conexión: se reintenta cuando la pestaña vuelva a estar visible.
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') void run();
    };

    void run();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [router]);

  return null;
};
