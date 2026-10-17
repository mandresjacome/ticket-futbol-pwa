import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { runTrackingJob } from '@/lib/tracking/job';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get('authorization') ?? '';
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

async function handle(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 });
  }
  try {
    const summary = await runTrackingJob();
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    console.error('tracking job failed', error);
    return NextResponse.json({ ok: false, error: 'Falló el seguimiento.' }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
