import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { PROVIDER, fetchFixturesByDate } from '@/lib/football/api-football';
import type { CompactFixture } from '@/lib/football/types';

const CACHE_TTL_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// El plan gratuito solo consulta ayer, hoy y mañana.
export function windowDates(): string[] {
  const now = Date.now();
  return [-1, 0, 1].map((offset) => new Date(now + offset * DAY_MS).toISOString().slice(0, 10));
}

// Una consulta por día cubre a todos los usuarios; si falla, se usa la caché vencida.
export async function getFixturesForDate(
  date: string,
  maxAgeMs: number = CACHE_TTL_MS
): Promise<CompactFixture[]> {
  const admin = createAdminClient();

  const { data: cached } = await admin
    .from('api_fixture_day_cache')
    .select('fetched_at, fixtures')
    .eq('provider', PROVIDER)
    .eq('day', date)
    .maybeSingle();

  const cachedFixtures = (cached?.fixtures ?? null) as CompactFixture[] | null;
  const isFresh = cached && Date.now() - new Date(cached.fetched_at as string).getTime() < maxAgeMs;
  if (cachedFixtures && isFresh) {
    return cachedFixtures;
  }

  try {
    const fixtures = await fetchFixturesByDate(date);
    const { error } = await admin.from('api_fixture_day_cache').upsert({
      provider: PROVIDER,
      day: date,
      fetched_at: new Date().toISOString(),
      fixtures,
    });
    if (error) {
      console.error('fixtures cache upsert failed', error);
    }
    return fixtures;
  } catch (error) {
    if (cachedFixtures) {
      console.error('fixtures refresh failed, using stale cache', error);
      return cachedFixtures;
    }
    throw error;
  }
}
