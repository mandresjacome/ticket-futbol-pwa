'use server';

import { createClient } from '@/lib/supabase/server';
import {
  ticketInputSchema,
  type CreateTicketResult,
} from '@/lib/tickets/schema';

const MAX_NUMERIC_12_2 = 9_999_999_999;

export async function createTicket(input: unknown): Promise<CreateTicketResult> {
  const parsed = ticketInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }
  const data = parsed.data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Debes iniciar sesión.' };
  }

  const marketIds = Array.from(new Set(data.selections.map((s) => s.marketId)));
  const { data: markets, error: marketsError } = await supabase
    .from('markets')
    .select('id, canonical_name_es, progress_unit, requires_player')
    .in('id', marketIds)
    .eq('is_active', true);

  if (marketsError || !markets || markets.length !== marketIds.length) {
    return { ok: false, error: 'Mercado no válido.' };
  }
  const marketsById = new Map(markets.map((m) => [m.id as string, m]));

  for (const selection of data.selections) {
    const market = marketsById.get(selection.marketId);
    if (market?.requires_player && !selection.playerName) {
      return { ok: false, error: `El mercado "${market.canonical_name_es}" requiere el nombre del jugador.` };
    }
  }

  const matchIds = Array.from(
    new Set(data.selections.map((s) => s.matchId).filter((id): id is string => id !== null))
  );
  if (matchIds.length > 0) {
    const { data: matches, error: matchesError } = await supabase
      .from('football_matches')
      .select('id')
      .in('id', matchIds);
    if (matchesError || !matches || matches.length !== matchIds.length) {
      return { ok: false, error: 'Partido no válido.' };
    }
  }

  const totalOdds =
    data.totalOdds ??
    Math.round(data.selections.reduce((acc, s) => acc * s.odds, 1) * 1000) / 1000;
  const potentialPayout = Math.round(data.stake * totalOdds * 100) / 100;

  if (potentialPayout > MAX_NUMERIC_12_2 || totalOdds > 9_999_999) {
    return { ok: false, error: 'Los valores ingresados son demasiado grandes.' };
  }

  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .insert({
      user_id: user.id,
      source_name: data.sourceName || null,
      status: 'upcoming',
      stake: data.stake,
      total_odds: totalOdds,
      potential_payout: potentialPayout,
      notes: data.notes || null,
    })
    .select('id')
    .single();

  if (ticketError || !ticket) {
    console.error('createTicket: ticket insert failed', ticketError);
    return { ok: false, error: 'No se pudo guardar el ticket. Inténtalo de nuevo.' };
  }

  const rows = data.selections.map((selection, index) => {
    const market = marketsById.get(selection.marketId)!;
    return {
      ticket_id: ticket.id,
      match_id: selection.matchId,
      market_id: selection.marketId,
      event_name: `${selection.homeTeamName} vs ${selection.awayTeamName}`,
      home_team_name: selection.homeTeamName,
      away_team_name: selection.awayTeamName,
      player_name: selection.playerName || null,
      market_raw_text: market.canonical_name_es,
      selection_label: selection.selectionLabel,
      line: selection.line,
      odds: selection.odds,
      progress_unit: market.progress_unit,
      event_starts_at: selection.eventStartsAt,
      status: 'upcoming',
      sort_order: index,
    };
  });

  const { error: selectionsError } = await supabase.from('ticket_selections').insert(rows);

  if (selectionsError) {
    console.error('createTicket: selections insert failed', selectionsError);
    // Sin transacción entre ambas inserciones: se elimina el ticket para no dejarlo vacío.
    await supabase.from('tickets').delete().eq('id', ticket.id);
    return { ok: false, error: 'No se pudo guardar las selecciones. Inténtalo de nuevo.' };
  }

  return { ok: true, ticketId: ticket.id as string };
}
