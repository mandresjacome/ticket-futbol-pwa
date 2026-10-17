import { z } from 'zod';

export type CompactFixture = {
  id: number;
  date: string;
  homeId: number;
  homeName: string;
  awayId: number;
  awayName: string;
  leagueName: string;
  country: string | null;
  season: number;
  status: string;
  elapsed: number | null;
  homeGoals: number | null;
  awayGoals: number | null;
};

export const apiEnvelopeSchema = z.object({
  errors: z.union([z.array(z.unknown()), z.record(z.string(), z.unknown())]),
  response: z.array(z.unknown()),
});

const apiFixtureSchema = z.object({
  fixture: z.object({
    id: z.number(),
    date: z.string(),
    status: z.object({ short: z.string().nullable(), elapsed: z.number().nullable() }),
  }),
  league: z.object({
    name: z.string(),
    country: z.string().nullable(),
    season: z.number(),
  }),
  teams: z.object({
    home: z.object({ id: z.number(), name: z.string() }),
    away: z.object({ id: z.number(), name: z.string() }),
  }),
  goals: z.object({ home: z.number().nullable(), away: z.number().nullable() }),
});

export function toCompactFixture(raw: unknown): CompactFixture | null {
  const parsed = apiFixtureSchema.safeParse(raw);
  if (!parsed.success) return null;
  const f = parsed.data;
  return {
    id: f.fixture.id,
    date: f.fixture.date,
    homeId: f.teams.home.id,
    homeName: f.teams.home.name,
    awayId: f.teams.away.id,
    awayName: f.teams.away.name,
    leagueName: f.league.name,
    country: f.league.country,
    season: f.league.season,
    status: f.fixture.status.short ?? 'UNKNOWN',
    elapsed: f.fixture.status.elapsed,
    homeGoals: f.goals.home,
    awayGoals: f.goals.away,
  };
}

// Códigos de estado de API-Football -> estados de football_matches.
export function mapFixtureStatus(short: string): string {
  switch (short) {
    case 'TBD':
    case 'NS':
      return 'scheduled';
    case '1H':
      return 'first_half';
    case 'HT':
      return 'halftime';
    case '2H':
      return 'second_half';
    case 'ET':
    case 'BT':
      return 'extra_time';
    case 'P':
      return 'penalties';
    case 'FT':
    case 'AET':
    case 'PEN':
    case 'AWD':
    case 'WO':
      return 'finished';
    case 'PST':
      return 'postponed';
    case 'CANC':
      return 'cancelled';
    case 'SUSP':
    case 'INT':
    case 'ABD':
      return 'suspended';
    default:
      return 'unknown';
  }
}
