import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { linkPendingSelections } from '@/lib/football/resolve-matches';
import { refreshMatches, type TrackedMatch } from '@/lib/tracking/refresh';

type MatchRow = {
  id: string;
  provider_match_id: string | null;
  kickoff_at: string | null;
  status: string;
  last_synced_at: string | null;
};

const ACTIVE_BEFORE_KICKOFF_MS = 30 * 60 * 1000;
const ACTIVE_AFTER_KICKOFF_MS = 4 * 60 * 60 * 1000;

// Refresca los partidos de los tickets del usuario. `active` indica si conviene seguir consultando.
export async function refreshUserMatches(): Promise<{ updated: boolean; active: boolean }> {
  const supabase = createClient();

  let linked = 0;
  try {
    linked = await linkPendingSelections();
  } catch (error) {
    console.error('refreshUserMatches: linking pending selections failed', error);
  }

  const { data, error } = await supabase
    .from('ticket_selections')
    .select('football_matches ( id, provider_match_id, kickoff_at, status, last_synced_at )')
    .not('match_id', 'is', null);
  if (error) {
    throw new Error(`No se pudieron leer los partidos: ${error.message}`);
  }

  const matches = new Map<string, TrackedMatch>();
  for (const row of (data ?? []) as unknown as { football_matches: MatchRow | MatchRow[] | null }[]) {
    const match = Array.isArray(row.football_matches) ? row.football_matches[0] : row.football_matches;
    if (!match) continue;
    matches.set(match.id, {
      id: match.id,
      providerMatchId: match.provider_match_id,
      status: match.status,
      kickoffAt: match.kickoff_at,
      lastSyncedAt: match.last_synced_at,
    });
  }

  const tracked = Array.from(matches.values());
  const updated = (await refreshMatches(tracked)) || linked > 0;

  const now = Date.now();
  const active = tracked.some((match) => {
    if (match.status === 'finished' || match.status === 'cancelled' || !match.kickoffAt) return false;
    const sinceKickoff = now - new Date(match.kickoffAt).getTime();
    return sinceKickoff > -ACTIVE_BEFORE_KICKOFF_MS && sinceKickoff < ACTIVE_AFTER_KICKOFF_MS;
  });

  return { updated, active };
}
