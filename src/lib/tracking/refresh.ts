import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { getFixturesForDate, windowDates } from '@/lib/football/fixtures-cache';
import { mapFixtureStatus } from '@/lib/football/types';

export type TrackedMatch = {
  id: string;
  providerMatchId: string | null;
  status: string;
  kickoffAt: string | null;
  lastSyncedAt: string | null;
};

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const POSTPONED_INTERVAL_MS = 60 * 60 * 1000;
const NEAR_KICKOFF_MS = 10 * 60 * 1000;
const MAX_AGE_MS = 36 * 60 * 60 * 1000;

// Solo se refrescan partidos por empezar o en curso; los terminados no se vuelven a consultar.
export function needsRefresh(match: TrackedMatch, now: number = Date.now()): boolean {
  if (!match.providerMatchId || !match.kickoffAt) return false;
  if (match.status === 'finished' || match.status === 'cancelled') return false;

  const kickoff = new Date(match.kickoffAt).getTime();
  if (kickoff - now > NEAR_KICKOFF_MS || now - kickoff > MAX_AGE_MS) return false;

  const lastSynced = match.lastSyncedAt ? new Date(match.lastSyncedAt).getTime() : 0;
  const interval =
    match.status === 'postponed' || match.status === 'suspended'
      ? POSTPONED_INTERVAL_MS
      : REFRESH_INTERVAL_MS;
  return now - lastSynced > interval;
}

// Usa la lista del día (1 consulta cubre todos los partidos y usuarios); devuelve true si actualizó algo.
export async function refreshMatches(matches: TrackedMatch[]): Promise<boolean> {
  const due = matches.filter((match) => needsRefresh(match));
  if (due.length === 0) return false;

  const allowedDates = new Set(windowDates());
  const byDate = new Map<string, TrackedMatch[]>();
  for (const match of due) {
    const date = new Date(match.kickoffAt as string).toISOString().slice(0, 10);
    if (!allowedDates.has(date)) continue;
    byDate.set(date, [...(byDate.get(date) ?? []), match]);
  }

  const admin = createAdminClient();
  let updated = false;

  for (const [date, list] of Array.from(byDate)) {
    let fixtures;
    try {
      fixtures = await getFixturesForDate(date, REFRESH_INTERVAL_MS);
    } catch (error) {
      console.error('refresh: fixtures for date failed', date, error);
      continue;
    }

    const fixtureById = new Map(fixtures.map((fixture) => [fixture.id, fixture]));
    const now = new Date().toISOString();

    await Promise.all(
      list.map(async (match) => {
        const fixture = fixtureById.get(Number(match.providerMatchId));
        const values = fixture
          ? {
              status: mapFixtureStatus(fixture.status),
              minute: fixture.elapsed,
              home_score: fixture.homeGoals,
              away_score: fixture.awayGoals,
              kickoff_at: fixture.date,
              last_synced_at: now,
            }
          : { last_synced_at: now };
        const { error } = await admin.from('football_matches').update(values).eq('id', match.id);
        if (error) {
          console.error('refresh: match update failed', match.id, error);
        } else {
          updated = true;
        }
      })
    );
  }

  return updated;
}
