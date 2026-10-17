// ==========================================
// TIPOS BASE
// ==========================================

export type Team = {
  id: string;
  name: string;
  logo?: string;
  shortName: string;
};

export type Player = {
  id: string;
  name: string;
  number?: number;
  position?: string;
  teamId: string;
};

export type FootballMatch = {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  competition: string;
  scheduledAt?: Date;
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';
  currentMinute?: number;
  homeScore?: number;
  awayScore?: number;
  venue?: string;
};

// ==========================================
// TIPOS DE MERCADOS Y SELECCIONES
// ==========================================

export type MarketType =
  | 'match_winner'           // Ganador del partido
  | 'double_chance'          // Doble oportunidad
  | 'over_under_goals'       // Más/menos goles
  | 'both_teams_score'       // Ambos equipos marcan
  | 'handicap'               // Hándicap
  | 'over_under_corners'     // Más/menos córners
  | 'over_under_cards'       // Más/menos tarjetas
  | 'player_shots'           // Tiros de jugador
  | 'player_shots_on_target' // Tiros al arco de jugador
  | 'player_goals'           // Goles de jugador
  | 'goalkeeper_saves';      // Atajadas del portero

export type Market = {
  type: MarketType;
  name: string;
  description?: string;
};

export type SelectionStatus =
  | 'upcoming'           // Próxima - partido no comenzado
  | 'live_tracking'      // En juego - partido en curso
  | 'currently_winning'  // Se está cumpliendo
  | 'target_reached'     // Objetivo alcanzado
  | 'lost'               // Perdida
  | 'finished'           // Finalizada
  | 'void'               // Anulada
  | 'needs_review';      // Requiere revisión

export type SelectionProgress = {
  current: number;
  target: number;
  unit: string; // "goles", "tiros", "córners", etc.
  message: string; // Mensaje descriptivo del progreso
  isOnTrack: boolean;
};

export type TicketSelection = {
  id: string;
  matchId: string;
  match: FootballMatch;
  market: Market;
  line?: number; // Línea (ej: 2.5 goles, 1.5 tiros)
  selection: string; // La selección específica (ej: "Más de 2.5", "Liverpool")
  odds: number; // Cuota
  status: SelectionStatus;
  progress?: SelectionProgress;
  playerId?: string; // Para mercados de jugadores
  player?: Player;
};

// ==========================================
// TIPOS DE TICKETS
// ==========================================

export type TicketType = 'single' | 'parlay' | 'system';

export type TicketStatus =
  | 'pending'    // Pendiente - aún no comenzó ningún partido
  | 'live'       // En vivo - al menos un partido activo
  | 'won'        // Ganado
  | 'lost'       // Perdido
  | 'void'       // Anulado
  | 'cashed_out'; // Retirado anticipadamente

export type Ticket = {
  id: string;
  userId: string;
  type: TicketType;
  selections: TicketSelection[];
  stake: number; // Monto apostado
  potentialWin: number; // Ganancia potencial
  totalOdds: number; // Cuota total
  status: TicketStatus;
  createdAt: Date;
  imageUrl?: string; // URL de la captura del ticket
  bookmaker?: string; // Casa de apuestas (opcional)
  notes?: string;
};

// ==========================================
// TIPOS DE RESUMEN
// ==========================================

export type TicketSummary = {
  total: number;
  pending: number;
  live: number;
  won: number;
  lost: number;
};

// ==========================================
// TIPOS DE NOTIFICACIÓN
// ==========================================

export type NotificationType =
  | 'match_starting'
  | 'selection_achieved'
  | 'selection_lost'
  | 'ticket_won'
  | 'ticket_lost'
  | 'status_change';

export type Notification = {
  id: string;
  ticketId: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
};

// ==========================================
// TIPOS DE USUARIO
// ==========================================

export type UserPreferences = {
  notifications: {
    matchStarting: boolean;
    selectionAchieved: boolean;
    selectionLost: boolean;
    ticketWon: boolean;
    ticketLost: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  language: 'es' | 'en';
};

export type User = {
  id: string;
  email: string;
  name?: string;
  preferences: UserPreferences;
  createdAt: Date;
};
