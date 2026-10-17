import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { refreshMatches, type TrackedMatch } from '@/lib/tracking/refresh';
import { evaluateSelection } from '@/lib/tracking/evaluate';
import type {
  FootballMatch,
  MarketType,
  SelectionStatus,
  Ticket,
  TicketSelection,
  TicketStatus,
  TicketSummary,
} from '@/types';

type MatchRow = {
  id: string;
  provider_match_id: string | null;
  competition_name: string | null;
  kickoff_at: string | null;
  status: string;
  minute: number | null;
  home_score: number | null;
  away_score: number | null;
  home_team_name: string;
  away_team_name: string;
  last_synced_at: string | null;
};

type SelectionRow = {
  id: string;
  match_id: string | null;
  event_name: string | null;
  home_team_name: string | null;
  away_team_name: string | null;
  player_name: string | null;
  market_raw_text: string | null;
  selection_label: string;
  line: number | string | null;
  odds: number | string | null;
  status: string;
  event_starts_at: string | null;
  sort_order: number;
  markets: { code: string } | { code: string }[] | null;
  football_matches: MatchRow | MatchRow[] | null;
};

type TicketRow = {
  id: string;
  user_id: string;
  source_name: string | null;
  status: string;
  stake: number | string | null;
  total_odds: number | string | null;
  potential_payout: number | string | null;
  notes: string | null;
  created_at: string;
  ticket_selections: SelectionRow[];
};

const TICKET_SELECT = `
  id, user_id, source_name, status, stake, total_odds, potential_payout, notes, created_at,
  ticket_selections (
    id, match_id, event_name, home_team_name, away_team_name, player_name,
    market_raw_text, selection_label, line, odds, status, event_starts_at, sort_order,
    markets ( code ),
    football_matches (
      id, provider_match_id, competition_name, kickoff_at, status, minute,
      home_score, away_score, home_team_name, away_team_name, last_synced_at
    )
  )
`;

const MARKET_TYPE_BY_CODE: Record<string, MarketType> = {
  match_winner: 'match_winner',
  double_chance: 'double_chance',
  total_goals: 'over_under_goals',
  both_teams_to_score: 'both_teams_score',
  handicap: 'handicap',
  total_corners: 'over_under_corners',
  total_cards: 'over_under_cards',
  player_goals: 'player_goals',
  player_shots: 'player_shots',
  player_shots_on_target: 'player_shots_on_target',
  goalkeeper_saves: 'goalkeeper_saves',
};

const TICKET_STATUS_BY_DB: Record<string, TicketStatus> = {
  live: 'live',
  won: 'won',
  lost: 'lost',
  void: 'void',
};

const LIVE_MATCH_STATUSES = new Set(['first_half', 'halftime', 'second_half', 'extra_time', 'penalties']);

const toNumber = (value: number | string | null): number => Number(value ?? 0);
const one = <T,>(value: T | T[] | null): T | null => (Array.isArray(value) ? value[0] ?? null : value);

function toDomainMatchStatus(status: string): FootballMatch['status'] {
  if (LIVE_MATCH_STATUSES.has(status)) return 'live';
  if (status === 'finished') return 'finished';
  if (status === 'postponed' || status === 'suspended') return 'postponed';
  if (status === 'cancelled') return 'cancelled';
  return 'scheduled';
}

function mapSelection(row: SelectionRow): TicketSelection {
  const market = one(row.markets);
  const dbMatch = one(row.football_matches);
  const homeName = row.home_team_name ?? row.event_name ?? 'Local';
  const awayName = row.away_team_name ?? '';
  const line = row.line === null ? null : Number(row.line);

  const kickoff = dbMatch?.kickoff_at ?? row.event_starts_at;
  const match: FootballMatch = {
    id: row.match_id ?? `selection_${row.id}`,
    homeTeam: { id: '', name: homeName, shortName: homeName },
    awayTeam: { id: '', name: awayName, shortName: awayName },
    competition: dbMatch?.competition_name ?? '',
    scheduledAt: kickoff ? new Date(kickoff) : undefined,
    status: dbMatch ? toDomainMatchStatus(dbMatch.status) : 'scheduled',
    currentMinute: dbMatch?.minute ?? undefined,
    homeScore: dbMatch?.home_score ?? undefined,
    awayScore: dbMatch?.away_score ?? undefined,
  };

  const evaluation = dbMatch
    ? evaluateSelection({
        marketCode: market?.code ?? null,
        label: row.selection_label,
        line,
        homeName: row.home_team_name,
        awayName: row.away_team_name,
        match: {
          homeName: dbMatch.home_team_name,
          awayName: dbMatch.away_team_name,
          status: dbMatch.status,
          minute: dbMatch.minute,
          homeScore: dbMatch.home_score,
          awayScore: dbMatch.away_score,
        },
      })
    : null;

  return {
    id: row.id,
    matchId: match.id,
    match,
    market: {
      type: MARKET_TYPE_BY_CODE[market?.code ?? ''] ?? 'match_winner',
      name: row.market_raw_text ?? 'Mercado',
    },
    line: line ?? undefined,
    selection: row.selection_label,
    odds: toNumber(row.odds),
    status: evaluation?.status ?? (row.status as SelectionStatus),
    progress: evaluation?.progress,
    player: row.player_name ? { id: '', name: row.player_name, teamId: '' } : undefined,
  };
}

// Un ticket combinado pierde con una sola selección perdida; solo se da por ganado si todas se cumplieron.
function deriveTicketStatus(selections: TicketSelection[], dbStatus: string): TicketStatus {
  if (selections.some((s) => s.status === 'lost')) return 'lost';
  if (selections.length > 0 && selections.every((s) => s.status === 'target_reached' || s.status === 'void')) {
    return selections.some((s) => s.status === 'target_reached') ? 'won' : 'void';
  }
  if (selections.some((s) => s.status === 'live_tracking' || s.status === 'currently_winning' || s.match.status === 'live')) {
    return 'live';
  }
  return TICKET_STATUS_BY_DB[dbStatus] ?? 'pending';
}

function mapTicket(row: TicketRow): Ticket {
  const selections = [...row.ticket_selections]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(mapSelection);

  return {
    id: row.id,
    userId: row.user_id,
    type: selections.length === 1 ? 'single' : 'parlay',
    selections,
    stake: toNumber(row.stake),
    potentialWin: toNumber(row.potential_payout),
    totalOdds: toNumber(row.total_odds),
    status: deriveTicketStatus(selections, row.status),
    createdAt: new Date(row.created_at),
    bookmaker: row.source_name ?? undefined,
    notes: row.notes ?? undefined,
  };
}

async function selectTickets(id?: string): Promise<TicketRow[]> {
  const supabase = createClient();
  const base = supabase.from('tickets').select(TICKET_SELECT);
  const { data, error } = id
    ? await base.eq('id', id)
    : await base.order('created_at', { ascending: false });

  if (error) {
    console.error('selectTickets failed', error);
    throw new Error('No se pudieron cargar los tickets.');
  }
  return (data ?? []) as unknown as TicketRow[];
}

function collectTrackedMatches(rows: TicketRow[]): TrackedMatch[] {
  const matches = new Map<string, TrackedMatch>();
  for (const row of rows) {
    for (const selection of row.ticket_selections) {
      const match = one(selection.football_matches);
      if (!match) continue;
      matches.set(match.id, {
        id: match.id,
        providerMatchId: match.provider_match_id,
        status: match.status,
        kickoffAt: match.kickoff_at,
        lastSyncedAt: match.last_synced_at,
      });
    }
  }
  return Array.from(matches.values());
}

// Antes de mostrar, actualiza marcadores de partidos en curso (con tope de consultas a la API).
async function loadTickets(id?: string): Promise<TicketRow[]> {
  let rows = await selectTickets(id);
  try {
    if (await refreshMatches(collectTrackedMatches(rows))) {
      rows = await selectTickets(id);
    }
  } catch (error) {
    console.error('loadTickets: refresh failed', error);
  }
  return rows;
}

export async function getUserTickets(): Promise<Ticket[]> {
  return (await loadTickets()).map(mapTicket);
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const [row] = await loadTickets(id);
  return row ? mapTicket(row) : null;
}

export function summarizeTickets(tickets: Ticket[]): TicketSummary {
  const count = (status: TicketStatus) => tickets.filter((t) => t.status === status).length;
  return {
    total: tickets.length,
    pending: count('pending'),
    live: count('live'),
    won: count('won'),
    lost: count('lost'),
  };
}
