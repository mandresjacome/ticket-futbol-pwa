import type {
  Team,
  Player,
  FootballMatch,
  Market,
  TicketSelection,
  Ticket,
  TicketSummary,
} from '@/types';

// ==========================================
// EQUIPOS DE EJEMPLO
// ==========================================

export const mockTeams: Team[] = [
  {
    id: 'team_1',
    name: 'Liverpool',
    shortName: 'LIV',
  },
  {
    id: 'team_2',
    name: 'Manchester City',
    shortName: 'MCI',
  },
  {
    id: 'team_3',
    name: 'Real Madrid',
    shortName: 'RMA',
  },
  {
    id: 'team_4',
    name: 'Barcelona',
    shortName: 'BAR',
  },
  {
    id: 'team_5',
    name: 'Bayern Munich',
    shortName: 'BAY',
  },
  {
    id: 'team_6',
    name: 'Borussia Dortmund',
    shortName: 'DOR',
  },
];

// ==========================================
// JUGADORES DE EJEMPLO
// ==========================================

export const mockPlayers: Player[] = [
  {
    id: 'player_1',
    name: 'Luis Díaz',
    number: 7,
    position: 'Delantero',
    teamId: 'team_1',
  },
  {
    id: 'player_2',
    name: 'Erling Haaland',
    number: 9,
    position: 'Delantero',
    teamId: 'team_2',
  },
  {
    id: 'player_3',
    name: 'Vinícius Jr',
    number: 7,
    position: 'Delantero',
    teamId: 'team_3',
  },
];

// ==========================================
// PARTIDOS DE EJEMPLO
// ==========================================

export const mockMatches: FootballMatch[] = [
  {
    id: 'match_1',
    homeTeam: mockTeams[0], // Liverpool
    awayTeam: mockTeams[1], // Manchester City
    competition: 'Premier League',
    scheduledAt: new Date('2026-07-28T19:00:00'),
    status: 'live',
    currentMinute: 38,
    homeScore: 1,
    awayScore: 1,
    venue: 'Anfield',
  },
  {
    id: 'match_2',
    homeTeam: mockTeams[2], // Real Madrid
    awayTeam: mockTeams[3], // Barcelona
    competition: 'LaLiga',
    scheduledAt: new Date('2026-07-28T21:00:00'),
    status: 'scheduled',
    venue: 'Santiago Bernabéu',
  },
  {
    id: 'match_3',
    homeTeam: mockTeams[4], // Bayern Munich
    awayTeam: mockTeams[5], // Borussia Dortmund
    competition: 'Bundesliga',
    scheduledAt: new Date('2026-07-29T17:30:00'),
    status: 'scheduled',
    venue: 'Allianz Arena',
  },
];

// ==========================================
// MERCADOS
// ==========================================

export const mockMarkets: Record<string, Market> = {
  over_under_goals: {
    type: 'over_under_goals',
    name: 'Más/Menos Goles',
    description: 'Total de goles en el partido',
  },
  player_shots_on_target: {
    type: 'player_shots_on_target',
    name: 'Tiros al Arco del Jugador',
    description: 'Número de tiros al arco de un jugador específico',
  },
  over_under_corners: {
    type: 'over_under_corners',
    name: 'Más/Menos Córners',
    description: 'Total de córners en el partido',
  },
  both_teams_score: {
    type: 'both_teams_score',
    name: 'Ambos Equipos Marcan',
    description: 'Ambos equipos marcan al menos un gol',
  },
};

// ==========================================
// SELECCIONES DE EJEMPLO
// ==========================================

export const mockSelections: TicketSelection[] = [
  {
    id: 'sel_1',
    matchId: 'match_1',
    match: mockMatches[0],
    market: mockMarkets.over_under_goals,
    line: 2.5,
    selection: 'Más de 2.5',
    odds: 1.85,
    status: 'live_tracking',
    progress: {
      current: 2,
      target: 3,
      unit: 'goles',
      message: 'Falta 1 gol',
      isOnTrack: true,
    },
  },
  {
    id: 'sel_2',
    matchId: 'match_1',
    match: mockMatches[0],
    market: mockMarkets.player_shots_on_target,
    line: 1.5,
    selection: 'Más de 1.5',
    odds: 2.1,
    status: 'currently_winning',
    playerId: 'player_1',
    player: mockPlayers[0],
    progress: {
      current: 1,
      target: 2,
      unit: 'tiros al arco',
      message: 'Luis Díaz: 1 de 2 tiros al arco',
      isOnTrack: true,
    },
  },
  {
    id: 'sel_3',
    matchId: 'match_1',
    match: mockMatches[0],
    market: mockMarkets.over_under_corners,
    line: 8.5,
    selection: 'Más de 8.5',
    odds: 1.75,
    status: 'live_tracking',
    progress: {
      current: 7,
      target: 9,
      unit: 'córners',
      message: 'Faltan 2 córners',
      isOnTrack: true,
    },
  },
  {
    id: 'sel_4',
    matchId: 'match_1',
    match: mockMatches[0],
    market: mockMarkets.both_teams_score,
    selection: 'Sí',
    odds: 1.65,
    status: 'target_reached',
    progress: {
      current: 2,
      target: 2,
      unit: 'equipos anotaron',
      message: 'La condición se cumple actualmente',
      isOnTrack: true,
    },
  },
];

// ==========================================
// TICKETS DE EJEMPLO
// ==========================================

export const mockTickets: Ticket[] = [
  {
    id: 'ticket_1',
    userId: 'user_demo',
    type: 'parlay',
    selections: mockSelections,
    stake: 10000,
    potentialWin: 73425,
    totalOdds: 7.34,
    status: 'live',
    createdAt: new Date('2026-07-28T18:30:00'),
    bookmaker: 'Demo Bookmaker',
  },
  {
    id: 'ticket_2',
    userId: 'user_demo',
    type: 'parlay',
    selections: [
      {
        id: 'sel_5',
        matchId: 'match_2',
        match: mockMatches[1],
        market: mockMarkets.over_under_goals,
        line: 2.5,
        selection: 'Más de 2.5',
        odds: 1.90,
        status: 'upcoming',
      },
      {
        id: 'sel_6',
        matchId: 'match_3',
        match: mockMatches[2],
        market: mockMarkets.both_teams_score,
        selection: 'Sí',
        odds: 1.80,
        status: 'upcoming',
      },
    ],
    stake: 5000,
    potentialWin: 17100,
    totalOdds: 3.42,
    status: 'pending',
    createdAt: new Date('2026-07-28T16:00:00'),
    bookmaker: 'Demo Bookmaker',
  },
  {
    id: 'ticket_3',
    userId: 'user_demo',
    type: 'single',
    selections: [
      {
        id: 'sel_7',
        matchId: 'match_1',
        match: {
          ...mockMatches[0],
          status: 'finished',
          currentMinute: 90,
          homeScore: 2,
          awayScore: 1,
        },
        market: mockMarkets.over_under_goals,
        line: 2.5,
        selection: 'Más de 2.5',
        odds: 1.85,
        status: 'finished',
        progress: {
          current: 3,
          target: 3,
          unit: 'goles',
          message: 'Objetivo cumplido',
          isOnTrack: true,
        },
      },
    ],
    stake: 15000,
    potentialWin: 27750,
    totalOdds: 1.85,
    status: 'won',
    createdAt: new Date('2026-07-27T14:00:00'),
    bookmaker: 'Demo Bookmaker',
  },
];

// ==========================================
// RESUMEN
// ==========================================

export const mockTicketSummary: TicketSummary = {
  total: 6,
  pending: 1,
  live: 2,
  won: 2,
  lost: 1,
};

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

export const getTicketById = (id: string): Ticket | undefined => {
  return mockTickets.find((ticket) => ticket.id === id);
};

export const getMatchById = (id: string): FootballMatch | undefined => {
  return mockMatches.find((match) => match.id === id);
};

export const getPlayerById = (id: string): Player | undefined => {
  return mockPlayers.find((player) => player.id === id);
};
