import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { linkPendingSelections } from '@/lib/football/resolve-matches';
import { refreshMatches, type TrackedMatch } from '@/lib/tracking/refresh';
import { evaluateSelection } from '@/lib/tracking/evaluate';
import { sendPushToUser } from '@/lib/push/send';

const OPEN_SELECTION_STATUSES = ['upcoming', 'live_tracking', 'currently_winning', 'needs_review'];
const LIVE_MATCH_STATUSES = ['first_half', 'halftime', 'second_half', 'extra_time', 'penalties'];
const MATCH_START_WINDOW_MS = 20 * 60 * 1000;
const MAX_ROWS = 500;
const MAX_INDIVIDUAL_PUSHES = 3;

type EventKind = 'match_start' | 'selection_reached' | 'selection_lost' | 'ticket_won' | 'ticket_lost';

type MatchRow = {
  id: string;
  kickoff_at: string | null;
  status: string;
  minute: number | null;
  home_score: number | null;
  away_score: number | null;
  home_team_name: string;
  away_team_name: string;
};

type OpenSelection = {
  id: string;
  ticket_id: string;
  selection_label: string;
  line: number | string | null;
  home_team_name: string | null;
  away_team_name: string | null;
  status: string;
  markets: { code: string } | { code: string }[] | null;
  football_matches: MatchRow | MatchRow[] | null;
  tickets: { user_id: string; status: string } | { user_id: string; status: string }[] | null;
};

type NotificationEvent = {
  user_id: string;
  ticket_id: string;
  selection_id: string | null;
  match_id: string | null;
  kind: EventKind;
  title: string;
  body: string;
};

export type TrackingSummary = {
  linked: number;
  openSelections: number;
  changed: number;
  newEvents: number;
  pushesSent: number;
};

const PREFERENCE_BY_KIND: Record<EventKind, string> = {
  match_start: 'notification_match_start',
  selection_reached: 'notification_selection_reached',
  selection_lost: 'notification_selection_reached',
  ticket_won: 'notification_ticket_completed',
  ticket_lost: 'notification_ticket_completed',
};

const one = <T,>(value: T | T[] | null): T | null => (Array.isArray(value) ? value[0] ?? null : value);

// Resultado estimado del ticket combinado a partir del estado de sus selecciones.
function deriveTicketStatus(statuses: string[]): 'won' | 'lost' | 'void' | 'live' | 'upcoming' {
  if (statuses.some((s) => s === 'lost')) return 'lost';
  if (statuses.length > 0 && statuses.every((s) => s === 'target_reached' || s === 'void')) {
    return statuses.some((s) => s === 'target_reached') ? 'won' : 'void';
  }
  if (statuses.some((s) => s === 'live_tracking' || s === 'currently_winning')) return 'live';
  return 'upcoming';
}

function matchLabel(row: OpenSelection): string {
  return `${row.home_team_name ?? 'Local'} vs ${row.away_team_name ?? 'Visitante'}`;
}

export async function runTrackingJob(): Promise<TrackingSummary> {
  const admin = createAdminClient();
  const summary: TrackingSummary = { linked: 0, openSelections: 0, changed: 0, newEvents: 0, pushesSent: 0 };

  try {
    summary.linked = await linkPendingSelections(admin, 300);
  } catch (error) {
    console.error('job: linking pending selections failed', error);
  }

  const { data: openIds, error: openIdsError } = await admin
    .from('ticket_selections')
    .select('match_id')
    .in('status', OPEN_SELECTION_STATUSES)
    .not('match_id', 'is', null)
    .limit(MAX_ROWS);
  if (openIdsError) throw new Error(`job: open selections query failed: ${openIdsError.message}`);

  const matchIds = Array.from(new Set((openIds ?? []).map((row) => row.match_id as string)));
  if (matchIds.length === 0) return summary;

  const { data: trackedRows, error: trackedError } = await admin
    .from('football_matches')
    .select('id, provider_match_id, kickoff_at, status, last_synced_at')
    .in('id', matchIds);
  if (trackedError) throw new Error(`job: matches query failed: ${trackedError.message}`);

  const tracked: TrackedMatch[] = (trackedRows ?? []).map((m) => ({
    id: m.id as string,
    providerMatchId: m.provider_match_id as string | null,
    status: m.status as string,
    kickoffAt: m.kickoff_at as string | null,
    lastSyncedAt: m.last_synced_at as string | null,
  }));
  try {
    await refreshMatches(tracked);
  } catch (error) {
    console.error('job: refreshing matches failed', error);
  }

  const { data: openRows, error: openError } = await admin
    .from('ticket_selections')
    .select(
      `id, ticket_id, selection_label, line, home_team_name, away_team_name, status,
       markets ( code ),
       football_matches ( id, kickoff_at, status, minute, home_score, away_score, home_team_name, away_team_name ),
       tickets ( user_id, status )`
    )
    .in('status', OPEN_SELECTION_STATUSES)
    .in('match_id', matchIds)
    .limit(MAX_ROWS);
  if (openError) throw new Error(`job: selections query failed: ${openError.message}`);

  const rows = (openRows ?? []) as unknown as OpenSelection[];
  summary.openSelections = rows.length;

  const events: NotificationEvent[] = [];
  const newStatusBySelection = new Map<string, string>();
  const touchedTickets = new Set<string>();
  const ticketInfo = new Map<string, { userId: string; status: string }>();

  for (const row of rows) {
    const ticket = one(row.tickets);
    if (ticket) ticketInfo.set(row.ticket_id, { userId: ticket.user_id, status: ticket.status });
  }

  const now = Date.now();
  const matchStartSeen = new Set<string>();

  await Promise.all(
    rows.map(async (row) => {
      const match = one(row.football_matches);
      const ticket = ticketInfo.get(row.ticket_id);
      if (!match || !ticket) return;

      // Partidos que acaban de comenzar (se avisa una vez por ticket y partido).
      const startKey = `${row.ticket_id}:${match.id}`;
      if (
        LIVE_MATCH_STATUSES.includes(match.status) &&
        match.kickoff_at &&
        now - new Date(match.kickoff_at).getTime() < MATCH_START_WINDOW_MS &&
        !matchStartSeen.has(startKey)
      ) {
        matchStartSeen.add(startKey);
        events.push({
          user_id: ticket.userId,
          ticket_id: row.ticket_id,
          selection_id: null,
          match_id: match.id,
          kind: 'match_start',
          title: 'Empieza un partido de tu ticket',
          body: `${matchLabel(row)} acaba de comenzar.`,
        });
      }

      const evaluation = evaluateSelection({
        marketCode: one(row.markets)?.code ?? null,
        label: row.selection_label,
        line: row.line === null ? null : Number(row.line),
        homeName: row.home_team_name,
        awayName: row.away_team_name,
        match: {
          homeName: match.home_team_name,
          awayName: match.away_team_name,
          status: match.status,
          minute: match.minute,
          homeScore: match.home_score,
          awayScore: match.away_score,
        },
      });
      if (!evaluation || evaluation.status === row.status) return;

      const { error } = await admin
        .from('ticket_selections')
        .update({ status: evaluation.status, progress_text: evaluation.progress?.message ?? null })
        .eq('id', row.id);
      if (error) {
        console.error('job: selection update failed', row.id, error);
        return;
      }

      summary.changed += 1;
      newStatusBySelection.set(row.id, evaluation.status);
      touchedTickets.add(row.ticket_id);

      // Si el ticket ya estaba perdido, las demás selecciones no generan avisos.
      if (ticket.status === 'lost') return;
      if (evaluation.status === 'target_reached') {
        events.push({
          user_id: ticket.userId,
          ticket_id: row.ticket_id,
          selection_id: row.id,
          match_id: null,
          kind: 'selection_reached',
          title: 'Selección cumplida',
          body: `${row.selection_label} (${matchLabel(row)}). Estimado: la casa de apuestas decide.`,
        });
      } else if (evaluation.status === 'lost') {
        events.push({
          user_id: ticket.userId,
          ticket_id: row.ticket_id,
          selection_id: row.id,
          match_id: null,
          kind: 'selection_lost',
          title: 'Selección perdida',
          body: `${row.selection_label} (${matchLabel(row)}).`,
        });
      }
    })
  );

  // Estado del ticket completo.
  const ticketOutcomes = new Map<string, 'won' | 'lost'>();
  if (touchedTickets.size > 0) {
    const { data: allSelections, error: allError } = await admin
      .from('ticket_selections')
      .select('ticket_id, status')
      .in('ticket_id', Array.from(touchedTickets));
    if (allError) {
      console.error('job: ticket selections query failed', allError);
    } else {
      const byTicket = new Map<string, string[]>();
      for (const s of allSelections ?? []) {
        byTicket.set(s.ticket_id as string, [...(byTicket.get(s.ticket_id as string) ?? []), s.status as string]);
      }
      for (const [ticketId, statuses] of Array.from(byTicket)) {
        const info = ticketInfo.get(ticketId);
        const derived = deriveTicketStatus(statuses);
        if (!info || derived === info.status || derived === 'upcoming') continue;
        const { error } = await admin.from('tickets').update({ status: derived }).eq('id', ticketId);
        if (error) {
          console.error('job: ticket update failed', ticketId, error);
          continue;
        }
        if (derived === 'won' || derived === 'lost') ticketOutcomes.set(ticketId, derived);
      }
    }
  }

  for (const [ticketId, outcome] of Array.from(ticketOutcomes)) {
    const info = ticketInfo.get(ticketId);
    if (!info) continue;
    events.push({
      user_id: info.userId,
      ticket_id: ticketId,
      selection_id: null,
      match_id: null,
      kind: outcome === 'won' ? 'ticket_won' : 'ticket_lost',
      title: outcome === 'won' ? 'Tu ticket va ganado' : 'Tu ticket se perdi\u00f3',
      body:
        outcome === 'won'
          ? 'Todas tus selecciones se cumplieron (estimado). La casa de apuestas confirma el resultado oficial.'
          : 'Una selecci\u00f3n fall\u00f3 (estimado). Revisa el detalle del ticket.',
    });
  }

  // El aviso del ticket completo reemplaza al de su última selección.
  const finalEvents = events.filter(
    (event) =>
      !(
        (event.kind === 'selection_reached' || event.kind === 'selection_lost') &&
        ticketOutcomes.has(event.ticket_id)
      )
  );
  if (finalEvents.length === 0) return summary;

  const { data: inserted, error: insertError } = await admin
    .from('notification_events')
    .upsert(finalEvents, { onConflict: 'user_id,kind,ticket_id,selection_id,match_id', ignoreDuplicates: true })
    .select('user_id, ticket_id, kind, title, body');
  if (insertError) throw new Error(`job: inserting events failed: ${insertError.message}`);

  const fresh = (inserted ?? []) as Pick<NotificationEvent, 'user_id' | 'ticket_id' | 'kind' | 'title' | 'body'>[];
  summary.newEvents = fresh.length;
  if (fresh.length === 0) return summary;

  const userIds = Array.from(new Set(fresh.map((event) => event.user_id)));
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, notification_match_start, notification_selection_reached, notification_ticket_completed')
    .in('id', userIds);
  const profileById = new Map((profiles ?? []).map((p) => [p.id as string, p as Record<string, unknown>]));

  for (const userId of userIds) {
    const profile = profileById.get(userId);
    const wanted = fresh.filter(
      (event) => event.user_id === userId && profile?.[PREFERENCE_BY_KIND[event.kind]] !== false
    );
    if (wanted.length === 0) continue;

    const payloads =
      wanted.length > MAX_INDIVIDUAL_PUSHES
        ? [{ title: 'Novedades en tus tickets', body: `Tienes ${wanted.length} novedades. \u00c1brelas para ver el detalle.`, url: '/' }]
        : wanted.map((event) => ({
            title: event.title,
            body: event.body,
            url: `/tickets/${event.ticket_id}`,
            tag: `${event.kind}-${event.ticket_id}`,
          }));

    for (const payload of payloads) {
      try {
        summary.pushesSent += (await sendPushToUser(userId, payload)).sent;
      } catch (error) {
        console.error('job: push failed', userId, error);
      }
    }
  }

  return summary;
}
