import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { PROVIDER } from '@/lib/football/api-football';
import { getFixturesForDate, windowDates } from '@/lib/football/fixtures-cache';
import { findFixture, prepareFixtures } from '@/lib/football/team-matching';
import { mapFixtureStatus, type CompactFixture } from '@/lib/football/types';
import type { ExtractedSelection } from '@/lib/ocr/schema';

const names = (...values: (string | null)[]) =>
  values.filter((value): value is string => Boolean(value));

async function persistMatches(fixtures: CompactFixture[]): Promise<Map<number, string>> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const teamRows = new Map<number, { name: string }>();
  for (const f of fixtures) {
    teamRows.set(f.homeId, { name: f.homeName });
    teamRows.set(f.awayId, { name: f.awayName });
  }

  const { data: teams, error: teamsError } = await admin
    .from('teams')
    .upsert(
      Array.from(teamRows, ([id, team]) => ({
        provider_name: PROVIDER,
        provider_team_id: String(id),
        name: team.name,
      })),
      { onConflict: 'provider_name,provider_team_id' }
    )
    .select('id, provider_team_id');
  if (teamsError || !teams) {
    throw new Error(`teams upsert failed: ${teamsError?.message}`);
  }
  const teamIdByProviderId = new Map(teams.map((t) => [t.provider_team_id as string, t.id as string]));

  const { data: matches, error: matchesError } = await admin
    .from('football_matches')
    .upsert(
      fixtures.map((f) => ({
        provider_name: PROVIDER,
        provider_match_id: String(f.id),
        competition_name: f.leagueName,
        season: String(f.season),
        home_team_id: teamIdByProviderId.get(String(f.homeId)) ?? null,
        away_team_id: teamIdByProviderId.get(String(f.awayId)) ?? null,
        home_team_name: f.homeName,
        away_team_name: f.awayName,
        kickoff_at: f.date,
        status: mapFixtureStatus(f.status),
        minute: f.elapsed,
        home_score: f.homeGoals,
        away_score: f.awayGoals,
        last_synced_at: now,
      })),
      { onConflict: 'provider_name,provider_match_id' }
    )
    .select('id, provider_match_id');
  if (matchesError || !matches) {
    throw new Error(`football_matches upsert failed: ${matchesError?.message}`);
  }

  return new Map(matches.map((m) => [Number(m.provider_match_id), m.id as string]));
}

// Un fallo aquí nunca debe impedir la lectura del ticket: se devuelven las selecciones sin cambios.
export async function resolveSelectionMatches(
  selections: ExtractedSelection[]
): Promise<ExtractedSelection[]> {
  try {
    const results = await Promise.allSettled(windowDates().map((date) => getFixturesForDate(date)));
    const fixtures = results.flatMap((result) => {
      if (result.status === 'fulfilled') return result.value;
      console.error('resolve: fixtures for date failed', result.reason);
      return [];
    });
    if (fixtures.length === 0) return selections;

    const prepared = prepareFixtures(fixtures);
    const found = selections.map((s) =>
      s.homeTeamName && s.awayTeamName
        ? findFixture(
            names(s.homeTeamEnglishName, s.homeTeamName),
            names(s.awayTeamEnglishName, s.awayTeamName),
            prepared
          )
        : null
    );

    const uniqueFixtures = Array.from(
      new Map(found.filter((f): f is CompactFixture => f !== null).map((f) => [f.id, f])).values()
    );
    if (uniqueFixtures.length === 0) return selections;

    let matchIds = new Map<number, string>();
    try {
      matchIds = await persistMatches(uniqueFixtures);
    } catch (error) {
      console.error('resolve: persisting matches failed', error);
    }

    return selections.map((s, index) => {
      const fixture = found[index];
      if (!fixture) return s;
      return {
        ...s,
        kickoffIso: fixture.date,
        matchId: matchIds.get(fixture.id) ?? null,
        competitionName: fixture.leagueName,
      };
    });
  } catch (error) {
    console.error('resolve: unexpected failure', error);
    return selections;
  }
}

const PENDING_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Vincula selecciones guardadas sin partido cuando su partido entra en la ventana de datos; devuelve cuántas vinculó.
export async function linkPendingSelections(): Promise<number> {
  const supabase = createClient();
  const since = new Date(Date.now() - PENDING_MAX_AGE_MS).toISOString();
  const { data, error } = await supabase
    .from('ticket_selections')
    .select('id, home_team_name, away_team_name, home_team_english_name, away_team_english_name')
    .is('match_id', null)
    .gte('created_at', since)
    .limit(100);
  if (error) {
    console.error('link pending: query failed', error);
    return 0;
  }
  if (!data || data.length === 0) return 0;

  const results = await Promise.allSettled(windowDates().map((date) => getFixturesForDate(date)));
  const fixtures = results.flatMap((result) => {
    if (result.status === 'fulfilled') return result.value;
    console.error('link pending: fixtures for date failed', result.reason);
    return [];
  });
  if (fixtures.length === 0) return 0;

  const prepared = prepareFixtures(fixtures);
  const found: { selectionId: string; fixture: CompactFixture }[] = [];
  for (const row of data) {
    if (!row.home_team_name || !row.away_team_name) continue;
    const fixture = findFixture(
      names(row.home_team_english_name as string | null, row.home_team_name as string),
      names(row.away_team_english_name as string | null, row.away_team_name as string),
      prepared
    );
    if (fixture) found.push({ selectionId: row.id as string, fixture });
  }
  if (found.length === 0) return 0;

  const matchIds = await persistMatches(Array.from(new Map(found.map((f) => [f.fixture.id, f.fixture])).values()));

  let linked = 0;
  await Promise.all(
    found.map(async ({ selectionId, fixture }) => {
      const matchId = matchIds.get(fixture.id);
      if (!matchId) return;
      const { error: updateError } = await supabase
        .from('ticket_selections')
        .update({ match_id: matchId, event_starts_at: fixture.date })
        .eq('id', selectionId);
      if (updateError) {
        console.error('link pending: update failed', updateError);
      } else {
        linked += 1;
      }
    })
  );
  return linked;
}
