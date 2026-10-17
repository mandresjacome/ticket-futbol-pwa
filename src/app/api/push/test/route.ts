import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PushConfigError, sendPushToUser } from '@/lib/push/send';

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Debes iniciar sesión.' }, { status: 401 });
  }

  try {
    const { sent } = await sendPushToUser(user.id, {
      title: 'Ticket Fútbol',
      body: 'Las notificaciones están funcionando.',
      url: '/profile',
      tag: 'test',
    });
    if (sent === 0) {
      return NextResponse.json(
        { ok: false, error: 'No hay dispositivos activos. Activa las notificaciones de nuevo.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, sent });
  } catch (error) {
    if (error instanceof PushConfigError) {
      console.error('push test: not configured', error.message);
      return NextResponse.json({ ok: false, error: 'Las notificaciones no están configuradas.' }, { status: 503 });
    }
    console.error('push test failed', error);
    return NextResponse.json({ ok: false, error: 'No se pudo enviar la prueba.' }, { status: 500 });
  }
}
