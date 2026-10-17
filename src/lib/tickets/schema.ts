import { z } from 'zod';

export const selectionInputSchema = z.object({
  marketId: z.uuid(),
  matchId: z.uuid().nullable(),
  homeTeamName: z.string().trim().min(1, 'Falta el equipo local').max(80),
  awayTeamName: z.string().trim().min(1, 'Falta el equipo visitante').max(80),
  playerName: z.string().trim().max(80).nullable(),
  selectionLabel: z.string().trim().min(1, 'Falta la selección').max(120),
  line: z.number().min(0).max(999).nullable(),
  odds: z.number().min(1.01, 'La cuota debe ser mayor a 1').max(10000),
  eventStartsAt: z.iso.datetime({ offset: true, message: 'Fecha inválida' }).nullable(),
});

export const ticketInputSchema = z.object({
  sourceName: z.string().trim().max(60).nullable(),
  stake: z.number().positive('El valor apostado debe ser mayor a 0').max(100_000_000),
  totalOdds: z.number().min(1.01).max(100_000).nullable(),
  notes: z.string().trim().max(500).nullable(),
  selections: z
    .array(selectionInputSchema)
    .min(1, 'Agrega al menos una selección')
    .max(30, 'Máximo 30 selecciones'),
});

export type SelectionInput = z.infer<typeof selectionInputSchema>;
export type TicketInput = z.infer<typeof ticketInputSchema>;

export type CreateTicketResult =
  | { ok: true; ticketId: string }
  | { ok: false; error: string };
