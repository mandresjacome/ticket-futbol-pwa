-- Seed data for Ticket Fútbol PWA
-- Inserts initial catalog of betting markets
-- These markets serve as normalized references for ticket selections

-- ============================================================================
-- MARKETS CATALOG
-- ============================================================================

INSERT INTO public.markets (code, canonical_name_es, canonical_name_en, category, progress_unit, requires_player, requires_team, is_active) VALUES
-- Match result markets
('match_winner', 'Ganador del partido', 'Match Winner', 'match_result', NULL, false, false, true),
('double_chance', 'Doble oportunidad', 'Double Chance', 'match_result', NULL, false, false, true),

-- Goals markets
('total_goals', 'Total de goles', 'Total Goals', 'goals', 'goals', false, false, true),
('both_teams_to_score', 'Ambos equipos marcan', 'Both Teams To Score', 'goals', NULL, false, false, true),
('handicap', 'Hándicap', 'Handicap', 'match_result', NULL, false, false, true),

-- Match events markets
('total_corners', 'Total de córners', 'Total Corners', 'match_events', 'corners', false, false, true),
('total_cards', 'Total de tarjetas', 'Total Cards', 'match_events', 'cards', false, false, true),

-- Player markets
('player_goals', 'Goles del jugador', 'Player Goals', 'player_stats', 'goals', true, false, true),
('player_shots', 'Tiros del jugador', 'Player Shots', 'player_stats', 'shots', true, false, true),
('player_shots_on_target', 'Tiros al arco del jugador', 'Player Shots On Target', 'player_stats', 'shots_on_target', true, false, true),
('goalkeeper_saves', 'Atajadas del portero', 'Goalkeeper Saves', 'player_stats', 'saves', true, false, true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- NOTES
-- ============================================================================

-- This catalog allows the application to normalize different expressions from betting houses.
-- For example:
--   - "Más de 0,5 tiros a puerta"
--   - "Jugador tendrá 1+ tiro al arco"
--   - "Over 0.5 shots on target"
-- All map to: player_shots_on_target

-- The OCR/AI normalization logic is not yet implemented.
-- This catalog prepares the structure for future integration.
