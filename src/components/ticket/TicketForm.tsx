'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createTicket } from '@/lib/tickets/actions';
import type { SelectionInput } from '@/lib/tickets/schema';
import type { ExtractedTicket } from '@/lib/ocr/schema';

export type MarketOption = {
  id: string;
  name: string;
  requiresPlayer: boolean;
};

type SelectionDraft = {
  key: number;
  marketId: string;
  homeTeamName: string;
  awayTeamName: string;
  playerName: string;
  selectionLabel: string;
  line: string;
  odds: string;
  eventStartsAt: string;
  matchId: string | null;
  competition: string;
};

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500';
const labelClass = 'mb-1 block text-sm font-medium text-gray-700';

// Acepta coma decimal ("2,5") y devuelve null si está vacío.
function parseNumber(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (normalized === '') return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

// Convierte un instante ISO al formato de <input type="datetime-local"> en la zona horaria del usuario.
function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const TicketForm: React.FC<{
  markets: MarketOption[];
  initialValues?: ExtractedTicket | null;
  onReset: () => void;
}> = ({ markets, initialValues, onReset }) => {
  const nextKey = React.useRef(1);
  const emptySelection = (): SelectionDraft => ({
    key: nextKey.current++,
    marketId: '',
    homeTeamName: '',
    awayTeamName: '',
    playerName: '',
    selectionLabel: '',
    line: '',
    odds: '',
    eventStartsAt: '',
    matchId: null,
    competition: '',
  });

  const [sourceName, setSourceName] = useState(initialValues?.sourceName ?? '');
  const [stake, setStake] = useState(initialValues?.stake?.toString() ?? '');
  const [totalOdds, setTotalOdds] = useState(initialValues?.totalOdds?.toString() ?? '');
  const [notes, setNotes] = useState('');
  const [selections, setSelections] = useState<SelectionDraft[]>(() =>
    initialValues && initialValues.selections.length > 0
      ? initialValues.selections.map((s) => ({
          key: nextKey.current++,
          marketId: s.marketId ?? '',
          homeTeamName: s.homeTeamName ?? '',
          awayTeamName: s.awayTeamName ?? '',
          playerName: s.playerName ?? '',
          selectionLabel: s.selectionLabel ?? '',
          line: s.line?.toString() ?? '',
          odds: s.odds?.toString() ?? '',
          eventStartsAt: s.kickoffIso ? toLocalInputValue(s.kickoffIso) : s.eventStartsAt ?? '',
          matchId: s.matchId,
          competition: s.competitionName ?? '',
        }))
      : [emptySelection()]
  );
  const [error, setError] = useState<string | null>(null);
  const [savedTicketId, setSavedTicketId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateSelection = (key: number, patch: Partial<SelectionDraft>) =>
    setSelections((prev) =>
      prev.map((s) => {
        if (s.key !== key) return s;
        // Al cambiar los equipos, el partido encontrado automáticamente deja de ser válido.
        const teamsChanged = 'homeTeamName' in patch || 'awayTeamName' in patch;
        return { ...s, ...patch, ...(teamsChanged ? { matchId: null, competition: '' } : {}) };
      })
    );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsedStake = parseNumber(stake);
    const parsedTotalOdds = parseNumber(totalOdds);
    if (parsedStake === null || Number.isNaN(parsedStake) || Number.isNaN(parsedTotalOdds)) {
      setError('Revisa el valor apostado y la cuota total.');
      return;
    }

    const payloadSelections: SelectionInput[] = [];
    for (const s of selections) {
      const odds = parseNumber(s.odds);
      const line = parseNumber(s.line);
      const startsAt = s.eventStartsAt ? new Date(s.eventStartsAt) : null;
      if (odds === null || Number.isNaN(odds) || Number.isNaN(line) || (startsAt && Number.isNaN(startsAt.getTime()))) {
        setError('Revisa las cuotas, líneas y fechas de las selecciones.');
        return;
      }
      payloadSelections.push({
        marketId: s.marketId,
        matchId: s.matchId,
        homeTeamName: s.homeTeamName,
        awayTeamName: s.awayTeamName,
        playerName: s.playerName.trim() || null,
        selectionLabel: s.selectionLabel,
        line,
        odds,
        eventStartsAt: startsAt ? startsAt.toISOString() : null,
      });
    }

    startTransition(async () => {
      const result = await createTicket({
        sourceName: sourceName.trim() || null,
        stake: parsedStake,
        totalOdds: parsedTotalOdds,
        notes: notes.trim() || null,
        selections: payloadSelections,
      });
      if (result.ok) {
        setSavedTicketId(result.ticketId);
      } else {
        setError(result.error);
      }
    });
  };

  if (savedTicketId) {
    return (
      <Card className="text-center">
        <CheckCircle2 className="mx-auto mb-3 text-green-600" size={48} />
        <h3 className="mb-1 text-lg font-semibold text-gray-900">Ticket guardado</h3>
        <p className="mb-4 text-sm text-gray-600">
          Tu ticket quedó registrado. El seguimiento en vivo se activará en una próxima versión.
        </p>
        <div className="space-y-2">
          <Button fullWidth onClick={onReset}>
            Crear otro ticket
          </Button>
          <Link href={`/tickets/${savedTicketId}`} className="block text-sm font-medium text-primary-600 hover:underline">
            Ver el ticket guardado
          </Link>
          <Link href="/" className="block text-sm font-medium text-primary-600 hover:underline">
            Volver al inicio
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <h3 className="mb-3 font-semibold text-gray-900">Datos del ticket</h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="sourceName" className={labelClass}>Casa de apuestas (opcional)</label>
            <input id="sourceName" type="text" maxLength={60} value={sourceName}
              onChange={(e) => setSourceName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="stake" className={labelClass}>Valor apostado (COP)</label>
            <input id="stake" type="text" inputMode="decimal" required value={stake}
              onChange={(e) => setStake(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="totalOdds" className={labelClass}>Cuota total (opcional)</label>
            <input id="totalOdds" type="text" inputMode="decimal" value={totalOdds}
              onChange={(e) => setTotalOdds(e.target.value)} className={inputClass} />
            <p className="mt-1 text-xs text-gray-500">Si la dejas vacía, se calcula multiplicando las cuotas.</p>
          </div>
          <div>
            <label htmlFor="notes" className={labelClass}>Notas (opcional)</label>
            <textarea id="notes" rows={2} maxLength={500} value={notes}
              onChange={(e) => setNotes(e.target.value)} className={inputClass} />
          </div>
        </div>
      </Card>

      {selections.map((selection, index) => {
        const market = markets.find((m) => m.id === selection.marketId);
        const id = (field: string) => `${field}-${selection.key}`;
        return (
          <Card key={selection.key}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Selección {index + 1}</h3>
              {selections.length > 1 && (
                <button type="button" aria-label={`Quitar selección ${index + 1}`}
                  onClick={() => setSelections((prev) => prev.filter((s) => s.key !== selection.key))}
                  className="text-gray-400 hover:text-red-600">
                  <Trash2 size={18} />
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={id('home')} className={labelClass}>Local</label>
                  <input id={id('home')} type="text" required maxLength={80} value={selection.homeTeamName}
                    onChange={(e) => updateSelection(selection.key, { homeTeamName: e.target.value })}
                    className={inputClass} />
                </div>
                <div>
                  <label htmlFor={id('away')} className={labelClass}>Visitante</label>
                  <input id={id('away')} type="text" required maxLength={80} value={selection.awayTeamName}
                    onChange={(e) => updateSelection(selection.key, { awayTeamName: e.target.value })}
                    className={inputClass} />
                </div>
              </div>
              <div>
                <label htmlFor={id('date')} className={labelClass}>Fecha y hora del partido (opcional)</label>
                <input id={id('date')} type="datetime-local" value={selection.eventStartsAt}
                  onChange={(e) => updateSelection(selection.key, { eventStartsAt: e.target.value })}
                  className={inputClass} />
                {selection.matchId && (
                  <p className="mt-1 text-xs text-green-700">
                    Partido encontrado{selection.competition ? `: ${selection.competition}` : ''}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor={id('market')} className={labelClass}>Mercado</label>
                <select id={id('market')} required value={selection.marketId}
                  onChange={(e) => updateSelection(selection.key, { marketId: e.target.value })}
                  className={inputClass}>
                  <option value="">Selecciona un mercado</option>
                  {markets.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              {market?.requiresPlayer && (
                <div>
                  <label htmlFor={id('player')} className={labelClass}>Jugador</label>
                  <input id={id('player')} type="text" required maxLength={80} value={selection.playerName}
                    onChange={(e) => updateSelection(selection.key, { playerName: e.target.value })}
                    className={inputClass} />
                </div>
              )}
              <div>
                <label htmlFor={id('label')} className={labelClass}>Selección (ej: Más de 2.5, Local)</label>
                <input id={id('label')} type="text" required maxLength={120} value={selection.selectionLabel}
                  onChange={(e) => updateSelection(selection.key, { selectionLabel: e.target.value })}
                  className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={id('line')} className={labelClass}>Línea (opcional)</label>
                  <input id={id('line')} type="text" inputMode="decimal" value={selection.line}
                    onChange={(e) => updateSelection(selection.key, { line: e.target.value })}
                    className={inputClass} />
                </div>
                <div>
                  <label htmlFor={id('odds')} className={labelClass}>Cuota</label>
                  <input id={id('odds')} type="text" inputMode="decimal" required value={selection.odds}
                    onChange={(e) => updateSelection(selection.key, { odds: e.target.value })}
                    className={inputClass} />
                </div>
              </div>
            </div>
          </Card>
        );
      })}

      {selections.length < 30 && (
        <Button variant="outline" fullWidth
          onClick={() => setSelections((prev) => [...prev, emptySelection()])}>
          <Plus className="mr-2" size={18} />
          Agregar selección
        </Button>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" fullWidth size="lg" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar ticket'}
      </Button>

      <p className="text-center text-xs text-gray-500">
        El seguimiento es estimado. La liquidación oficial siempre corresponde a tu casa de apuestas.
      </p>
    </form>
  );
};
