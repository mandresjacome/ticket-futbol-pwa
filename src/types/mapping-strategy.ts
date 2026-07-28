// ==========================================
// ESTRATEGIA DE MAPEO DE TIPOS
// ==========================================

/**
 * Este archivo documenta la estrategia para mapear entre:
 * 1. Tipos de dominio actuales (src/types/index.ts)
 * 2. Filas de Supabase (futuro: generadas desde esquema)
 * 3. DTOs para creación/actualización
 * 4. Respuestas de APIs deportivas externas
 * 
 * NOTA: Los tipos de base de datos deberán generarse automáticamente con:
 * npx supabase gen types typescript --local > src/types/database.types.ts
 * 
 * Por ahora, este archivo sirve como documentación provisional.
 */

// ==========================================
// MAPEO: TIPOS DE DOMINIO → SUPABASE
// ==========================================

/**
 * Team (dominio) → teams (Supabase)
 * 
 * Transformación:
 * - id → id (UUID)
 * - name → name
 * - logo → logo_url
 * - shortName → short_name
 * 
 * Campos adicionales en DB:
 * - provider_name, provider_team_id (para sincronización)
 * - country, created_at, updated_at
 */

/**
 * Player (dominio) → players (Supabase)
 * 
 * Transformación:
 * - id → id (UUID)
 * - name → common_name o full_name
 * - number → (no almacenado en DB, es contextual del partido)
 * - position → position
 * - teamId → team_id
 * 
 * Campos adicionales en DB:
 * - provider_name, provider_player_id
 * - full_name (además de common_name)
 * - created_at, updated_at
 */

/**
 * FootballMatch (dominio) → football_matches (Supabase)
 * 
 * Transformación:
 * - id → id (UUID)
 * - homeTeam.id → home_team_id
 * - homeTeam.name → home_team_name (preservar nombre histórico)
 * - awayTeam.id → away_team_id
 * - awayTeam.name → away_team_name (preservar nombre histórico)
 * - competition → competition_name
 * - scheduledAt → kickoff_at
 * - status → status (mapear estados)
 * - currentMinute → minute
 * - homeScore → home_score
 * - awayScore → away_score
 * 
 * Mapeo de estados:
 * - 'scheduled' → 'scheduled'
 * - 'live' → 'first_half' | 'halftime' | 'second_half'
 * - 'finished' → 'finished'
 * - 'postponed' → 'postponed'
 * - 'cancelled' → 'cancelled'
 * 
 * Campos adicionales en DB:
 * - provider_name, provider_match_id
 * - season, last_synced_at
 * - created_at, updated_at
 */

/**
 * Market (dominio) → markets (Supabase)
 * 
 * Transformación:
 * - type → code
 * - name → canonical_name_es
 * - description → (derivado de category)
 * 
 * Mapeo de códigos:
 * - 'over_under_goals' → 'total_goals'
 * - 'both_teams_score' → 'both_teams_to_score'
 * - 'over_under_corners' → 'total_corners'
 * - 'over_under_cards' → 'total_cards'
 * - Resto coinciden
 * 
 * Campos adicionales en DB:
 * - canonical_name_en
 * - category, progress_unit
 * - requires_player, requires_team
 * - is_active, created_at, updated_at
 */

/**
 * TicketSelection (dominio) → ticket_selections (Supabase)
 * 
 * Transformación:
 * - id → id (UUID)
 * - matchId → match_id
 * - match.homeTeam.name → home_team_name (histórico)
 * - match.awayTeam.name → away_team_name (histórico)
 * - market.type → market_id (lookup en tabla markets)
 * - line → line
 * - selection → selection_label
 * - odds → odds
 * - status → status (mismo mapeo)
 * - progress.current → current_value
 * - progress.target → target_value
 * - progress.unit → progress_unit
 * - progress.message → progress_text
 * - playerId → player_id
 * - player.name → player_name (histórico)
 * 
 * Campos adicionales en DB:
 * - ticket_id (FK obligatorio)
 * - team_id, event_name, market_raw_text
 * - period, needs_review_reason, sort_order
 * - created_at, updated_at
 */

/**
 * Ticket (dominio) → tickets (Supabase)
 * 
 * Transformación:
 * - id → id (UUID)
 * - type → (no almacenado directamente, inferible de número de selecciones)
 * - status → status (mapear estados)
 * - stake → stake
 * - totalOdds → total_odds
 * - potentialWin → potential_payout
 * - currency → currency
 * - bookmaker → source_name
 * - createdAt → created_at
 * 
 * Mapeo de estados:
 * - 'pending' → 'upcoming'
 * - 'live' → 'live'
 * - 'won' → 'won'
 * - 'lost' → 'lost'
 * - 'void' → 'void'
 * - 'cashed_out' → 'archived' (o mantener como completed)
 * 
 * Campos adicionales en DB:
 * - user_id (FK obligatorio)
 * - ticket_reference, placed_at, notes
 * - updated_at
 */

// ==========================================
// DTOs PARA CREACIÓN
// ==========================================

/**
 * CreateTicketDTO
 * 
 * Usado cuando usuario carga un ticket manualmente o desde OCR
 * 
 * {
 *   stake?: number;
 *   source_name?: string; // Nombre visual de la casa
 *   selections: CreateSelectionDTO[];
 * }
 */

/**
 * CreateSelectionDTO
 * 
 * {
 *   home_team_name: string;  // Del pantallazo
 *   away_team_name: string;  // Del pantallazo
 *   market_raw_text: string; // Del pantallazo
 *   selection_label: string; // Del pantallazo
 *   odds: number;
 *   player_name?: string;    // Si aplica
 *   
 *   // Campos opcionales para normalización posterior
 *   match_id?: string;
 *   market_id?: string;
 *   player_id?: string;
 * }
 */

// ==========================================
// DTOs PARA ACTUALIZACIÓN
// ==========================================

/**
 * UpdateTicketDTO
 * 
 * {
 *   status?: TicketStatus;
 *   notes?: string;
 * }
 */

/**
 * UpdateSelectionDTO
 * 
 * {
 *   status?: SelectionStatus;
 *   current_value?: number;
 *   target_value?: number;
 *   progress_text?: string;
 *   needs_review_reason?: string;
 * }
 */

// ==========================================
// MAPEO: RESPUESTAS DE API EXTERNA → SUPABASE
// ==========================================

/**
 * API-Football (provisional) → football_matches
 * 
 * Ejemplo respuesta API-Football:
 * {
 *   fixture: {
 *     id: 12345,
 *     date: "2026-07-28T20:00:00+00:00",
 *     status: { short: "1H", elapsed: 23 }
 *   },
 *   teams: {
 *     home: { id: 40, name: "Liverpool", logo: "..." },
 *     away: { id: 50, name: "Manchester City", logo: "..." }
 *   },
 *   goals: { home: 1, away: 0 },
 *   score: { ... }
 * }
 * 
 * Mapeo:
 * - fixture.id → provider_match_id
 * - "api-football" → provider_name
 * - fixture.date → kickoff_at
 * - fixture.status.short → status (mapear códigos)
 * - fixture.status.elapsed → minute
 * - teams.home.id → lookup/create en teams, obtener home_team_id
 * - teams.home.name → home_team_name
 * - teams.away.id → lookup/create en teams, obtener away_team_id
 * - teams.away.name → away_team_name
 * - goals.home → home_score
 * - goals.away → away_score
 * 
 * Códigos de estado API-Football:
 * - "NS" (Not Started) → 'scheduled'
 * - "1H" (First Half) → 'first_half'
 * - "HT" (Halftime) → 'halftime'
 * - "2H" (Second Half) → 'second_half'
 * - "ET" (Extra Time) → 'extra_time'
 * - "P" (Penalties) → 'penalties'
 * - "FT" (Full Time) → 'finished'
 * - "SUSP" (Suspended) → 'suspended'
 * - "PST" (Postponed) → 'postponed'
 * - "CANC" (Cancelled) → 'cancelled'
 */

/**
 * API-Football (statistics) → selection progress
 * 
 * Ejemplo respuesta statistics:
 * {
 *   statistics: [
 *     { type: "Shots on Goal", value: 3 },
 *     { type: "Shots off Goal", value: 2 },
 *     { type: "Corner Kicks", value: 4 }
 *   ],
 *   players: [...]
 * }
 * 
 * Mapeo:
 * - Para cada ticket_selection con match_id = current_match:
 *   - Si market = 'player_shots_on_target' y player_id = X:
 *     - Buscar en players[].statistics "Shots on Goal"
 *     - current_value = valor encontrado
 *     - target_value = line de la selección
 *     - Calcular status según comparación
 */

// ==========================================
// FUNCIONES DE TRANSFORMACIÓN (FUTURAS)
// ==========================================

/**
 * // src/lib/mappers/ticket.mapper.ts
 * 
 * export function mapTicketFromDB(row: Database['public']['Tables']['tickets']['Row']): Ticket {
 *   return {
 *     id: row.id,
 *     type: inferTicketType(row.selections),
 *     status: mapTicketStatusFromDB(row.status),
 *     stake: row.stake ?? 0,
 *     totalOdds: row.total_odds ?? 1,
 *     potentialWin: row.potential_payout ?? 0,
 *     currency: row.currency,
 *     bookmaker: row.source_name ?? 'Desconocido',
 *     createdAt: new Date(row.created_at),
 *     selections: [] // mapear desde ticket_selections
 *   };
 * }
 * 
 * export function mapTicketToDB(ticket: CreateTicketDTO, userId: string): Database['public']['Tables']['tickets']['Insert'] {
 *   return {
 *     user_id: userId,
 *     stake: ticket.stake,
 *     source_name: ticket.source_name,
 *     status: 'draft',
 *     currency: 'COP'
 *   };
 * }
 */

// ==========================================
// NOTAS IMPORTANTES
// ==========================================

/**
 * 1. NO duplicar tipos innecesariamente
 *    - Los tipos de dominio (index.ts) deben seguir siendo la fuente de verdad para la UI
 *    - Los tipos de DB (database.types.ts) son solo para queries y mutaciones
 *    - Los mappers traducen entre ambos mundos
 * 
 * 2. Generación automática de tipos de DB
 *    - Una vez el proyecto remoto de Supabase esté configurado:
 *      npx supabase gen types typescript --local > src/types/database.types.ts
 *    - Esto generará tipos exactos desde el esquema PostgreSQL
 * 
 * 3. Campos históricos textuales
 *    - Siempre preservar nombres originales (home_team_name, player_name, etc.)
 *    - Incluso después de vincular con IDs normalizados
 *    - Esto previene pérdida de contexto si catálogos cambian
 * 
 * 4. Estados compatibles
 *    - Los estados de ticket_selections en DB coinciden exactamente con SelectionStatus
 *    - Los estados de tickets en DB tienen algunos adicionales (draft, needs_review, archived)
 *    - Los mappers deben manejar estas diferencias
 * 
 * 5. Provider-agnostic
 *    - Todos los mapeos de APIs externas son provisionales
 *    - El sistema debe poder cambiar de proveedor sin romper la estructura
 */

export type {}; // Asegurar que TypeScript trate esto como módulo
