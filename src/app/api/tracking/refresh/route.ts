import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { refreshUserMatches } from '@/lib/tracking/user-refresh';

export const maxDuration = 30;

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Debes iniciar sesión.' }, { status: 401 });
  }

  try {
    const result = await refreshUserMatches();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('tracking refresh failed', error);
    return NextResponse.json({ ok: false, error: 'No se pudo actualizar.' }, { status: 500 });
  }
}
