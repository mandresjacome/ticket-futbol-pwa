import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { subscriptionSchema, unsubscribeSchema } from '@/lib/push/schema';

async function currentUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Debes iniciar sesión.' }, { status: 401 });
  }

  const parsed = subscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Suscripción inválida.' }, { status: 400 });
  }

  const { endpoint, keys } = parsed.data;
  const { error } = await createAdminClient()
    .from('push_subscriptions')
    .upsert(
      {
        user_id: userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
      },
      { onConflict: 'endpoint' }
    );

  if (error) {
    console.error('push subscribe failed', error);
    return NextResponse.json({ ok: false, error: 'No se pudo guardar la suscripción.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Debes iniciar sesión.' }, { status: 401 });
  }

  const parsed = unsubscribeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Solicitud inválida.' }, { status: 400 });
  }

  const { error } = await createAdminClient()
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', parsed.data.endpoint)
    .eq('user_id', userId);

  if (error) {
    console.error('push unsubscribe failed', error);
    return NextResponse.json({ ok: false, error: 'No se pudo desactivar.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
