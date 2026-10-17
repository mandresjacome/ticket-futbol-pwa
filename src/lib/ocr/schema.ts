import { z } from 'zod';

const MAX_SELECTIONS = 30;

// Cada campo cae a null si el modelo devuelve algo inválido: el resultado solo rellena un formulario editable.
const text = (max: number) => z.string().trim().min(1).max(max).nullable().catch(null);
const positive = z.number().positive().finite().nullable().catch(null);

export const rawExtractedSelectionSchema = z.object({
  homeTeamName: text(80),
  awayTeamName: text(80),
  homeTeamEnglishName: text(80),
  awayTeamEnglishName: text(80),
  eventStartsAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    .nullable()
    .catch(null),
  marketCode: text(60),
  playerName: text(80),
  selectionLabel: text(120),
  line: z.number().min(0).max(999).nullable().catch(null),
  odds: positive,
});

export const rawExtractedTicketSchema = z.object({
  sourceName: text(60),
  stake: positive,
  totalOdds: positive,
  selections: z
    .array(rawExtractedSelectionSchema)
    .catch([])
    .transform((items) => items.slice(0, MAX_SELECTIONS)),
});

export type ExtractedSelection = {
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeTeamEnglishName: string | null;
  awayTeamEnglishName: string | null;
  eventStartsAt: string | null;
  // Rellenados al resolver el partido contra la API de estadísticas.
  kickoffIso: string | null;
  matchId: string | null;
  competitionName: string | null;
  marketId: string | null;
  playerName: string | null;
  selectionLabel: string | null;
  line: number | null;
  odds: number | null;
};

export type ExtractedTicket = {
  sourceName: string | null;
  stake: number | null;
  totalOdds: number | null;
  selections: ExtractedSelection[];
};

export type ExtractResult =
  | { ok: true; ticket: ExtractedTicket }
  | { ok: false; error: string };
