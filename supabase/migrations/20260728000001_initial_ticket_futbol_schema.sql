-- Migration: Initial Ticket Fútbol PWA Schema
-- Description: Creates all tables, relationships, RLS policies, and indexes for the MVP
-- Author: Ticket Fútbol PWA Team
-- Date: 2026-07-28

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create profile when new user registers
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NULL),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TABLE: profiles
-- ============================================================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    notification_match_start BOOLEAN NOT NULL DEFAULT true,
    notification_selection_reached BOOLEAN NOT NULL DEFAULT true,
    notification_ticket_completed BOOLEAN NOT NULL DEFAULT true,
    preferred_language TEXT NOT NULL DEFAULT 'es',
    preferred_theme TEXT NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT profiles_preferred_language_check CHECK (preferred_language IN ('es', 'en')),
    CONSTRAINT profiles_preferred_theme_check CHECK (preferred_theme IN ('system', 'light', 'dark'))
);

-- Trigger to update updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-create profile on user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- TABLE: tickets
-- ============================================================================

CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_name TEXT,
    ticket_reference TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    stake NUMERIC(12,2),
    total_odds NUMERIC(10,3),
    potential_payout NUMERIC(12,2),
    currency CHAR(3) NOT NULL DEFAULT 'COP',
    placed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT tickets_status_check CHECK (status IN (
        'draft', 'needs_review', 'upcoming', 'live', 
        'completed', 'won', 'lost', 'void', 'archived'
    )),
    CONSTRAINT tickets_stake_check CHECK (stake IS NULL OR stake >= 0),
    CONSTRAINT tickets_total_odds_check CHECK (total_odds IS NULL OR total_odds > 0),
    CONSTRAINT tickets_potential_payout_check CHECK (potential_payout IS NULL OR potential_payout >= 0),
    CONSTRAINT tickets_currency_uppercase CHECK (currency = UPPER(currency))
);

-- Trigger to update updated_at
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_created_at ON public.tickets(created_at DESC);

-- ============================================================================
-- TABLE: ticket_files
-- ============================================================================

CREATE TABLE public.ticket_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    original_filename TEXT,
    mime_type TEXT,
    size_bytes BIGINT,
    processing_status TEXT NOT NULL DEFAULT 'pending',
    ocr_raw_text TEXT,
    contains_personal_data BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT ticket_files_processing_status_check CHECK (processing_status IN (
        'pending', 'uploaded', 'processing', 'processed', 'failed', 'deleted'
    )),
    CONSTRAINT ticket_files_size_check CHECK (size_bytes IS NULL OR size_bytes >= 0),
    CONSTRAINT ticket_files_mime_type_check CHECK (
        mime_type IS NULL OR mime_type IN (
            'image/jpeg', 'image/png', 'image/webp', 'application/pdf'
        )
    )
);

-- Trigger to update updated_at
CREATE TRIGGER update_ticket_files_updated_at
    BEFORE UPDATE ON public.ticket_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_ticket_files_ticket_id ON public.ticket_files(ticket_id);

-- ============================================================================
-- TABLE: teams
-- ============================================================================

CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT,
    provider_team_id TEXT,
    name TEXT NOT NULL,
    short_name TEXT,
    country TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint for provider + external ID when both exist
    CONSTRAINT teams_provider_unique UNIQUE NULLS NOT DISTINCT (provider_name, provider_team_id)
);

-- Trigger to update updated_at
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: players
-- ============================================================================

CREATE TABLE public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    provider_name TEXT,
    provider_player_id TEXT,
    full_name TEXT NOT NULL,
    common_name TEXT,
    position TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint for provider + external ID when both exist
    CONSTRAINT players_provider_unique UNIQUE NULLS NOT DISTINCT (provider_name, provider_player_id)
);

-- Trigger to update updated_at
CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON public.players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_players_team_id ON public.players(team_id);

-- ============================================================================
-- TABLE: football_matches
-- ============================================================================

CREATE TABLE public.football_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT,
    provider_match_id TEXT,
    competition_name TEXT,
    season TEXT,
    home_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    away_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    home_team_name TEXT NOT NULL,
    away_team_name TEXT NOT NULL,
    kickoff_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'scheduled',
    minute INTEGER,
    home_score INTEGER,
    away_score INTEGER,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT football_matches_status_check CHECK (status IN (
        'scheduled', 'postponed', 'cancelled', 'first_half', 'halftime',
        'second_half', 'extra_time', 'penalties', 'finished', 'suspended', 'unknown'
    )),
    CONSTRAINT football_matches_teams_different CHECK (
        home_team_id IS NULL OR away_team_id IS NULL OR home_team_id != away_team_id
    ),
    CONSTRAINT football_matches_minute_check CHECK (minute IS NULL OR minute >= 0),
    CONSTRAINT football_matches_home_score_check CHECK (home_score IS NULL OR home_score >= 0),
    CONSTRAINT football_matches_away_score_check CHECK (away_score IS NULL OR away_score >= 0),
    CONSTRAINT football_matches_provider_unique UNIQUE NULLS NOT DISTINCT (provider_name, provider_match_id)
);

-- Trigger to update updated_at
CREATE TRIGGER update_football_matches_updated_at
    BEFORE UPDATE ON public.football_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_football_matches_kickoff_at ON public.football_matches(kickoff_at);
CREATE INDEX idx_football_matches_status ON public.football_matches(status);

-- ============================================================================
-- TABLE: markets
-- ============================================================================

CREATE TABLE public.markets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    canonical_name_es TEXT NOT NULL,
    canonical_name_en TEXT,
    category TEXT NOT NULL,
    progress_unit TEXT,
    requires_player BOOLEAN NOT NULL DEFAULT false,
    requires_team BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to update updated_at
CREATE TRIGGER update_markets_updated_at
    BEFORE UPDATE ON public.markets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: ticket_selections
-- ============================================================================

CREATE TABLE public.ticket_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    match_id UUID REFERENCES public.football_matches(id) ON DELETE SET NULL,
    market_id UUID REFERENCES public.markets(id) ON DELETE SET NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    
    -- Historical text fields (preserved from original ticket)
    event_name TEXT,
    home_team_name TEXT,
    away_team_name TEXT,
    player_name TEXT,
    team_name TEXT,
    market_raw_text TEXT,
    
    -- Selection details
    selection_label TEXT NOT NULL,
    line NUMERIC(10,2),
    odds NUMERIC(10,3),
    period TEXT,
    
    -- Status and progress
    status TEXT NOT NULL DEFAULT 'upcoming',
    current_value NUMERIC(12,2),
    target_value NUMERIC(12,2),
    progress_unit TEXT,
    progress_text TEXT,
    needs_review_reason TEXT,
    
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT ticket_selections_status_check CHECK (status IN (
        'upcoming', 'live_tracking', 'currently_winning', 
        'target_reached', 'lost', 'finished', 'void', 'needs_review'
    )),
    CONSTRAINT ticket_selections_odds_check CHECK (odds IS NULL OR odds > 0),
    CONSTRAINT ticket_selections_sort_order_check CHECK (sort_order >= 0),
    CONSTRAINT ticket_selections_current_value_check CHECK (
        current_value IS NULL OR current_value >= 0
    ),
    CONSTRAINT ticket_selections_target_value_check CHECK (
        target_value IS NULL OR target_value >= 0
    )
);

-- Trigger to update updated_at
CREATE TRIGGER update_ticket_selections_updated_at
    BEFORE UPDATE ON public.ticket_selections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_ticket_selections_ticket_id ON public.ticket_selections(ticket_id);
CREATE INDEX idx_ticket_selections_match_id ON public.ticket_selections(match_id);
CREATE INDEX idx_ticket_selections_status ON public.ticket_selections(status);

-- ============================================================================
-- TABLE: selection_progress_snapshots
-- ============================================================================

CREATE TABLE public.selection_progress_snapshots (
    id BIGSERIAL PRIMARY KEY,
    selection_id UUID NOT NULL REFERENCES public.ticket_selections(id) ON DELETE CASCADE,
    match_minute INTEGER,
    current_value NUMERIC(12,2),
    target_value NUMERIC(12,2),
    status TEXT NOT NULL,
    progress_text TEXT,
    source_event_id TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT selection_progress_snapshots_status_check CHECK (status IN (
        'upcoming', 'live_tracking', 'currently_winning', 
        'target_reached', 'lost', 'finished', 'void', 'needs_review'
    )),
    CONSTRAINT selection_progress_snapshots_match_minute_check CHECK (
        match_minute IS NULL OR match_minute >= 0
    ),
    CONSTRAINT selection_progress_snapshots_current_value_check CHECK (
        current_value IS NULL OR current_value >= 0
    ),
    CONSTRAINT selection_progress_snapshots_target_value_check CHECK (
        target_value IS NULL OR target_value >= 0
    )
);

-- Indexes
CREATE INDEX idx_selection_progress_snapshots_selection_id ON public.selection_progress_snapshots(selection_id);
CREATE INDEX idx_selection_progress_snapshots_recorded_at ON public.selection_progress_snapshots(recorded_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all user-facing tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.selection_progress_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.football_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: profiles
-- ============================================================================

CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- RLS POLICIES: tickets
-- ============================================================================

CREATE POLICY "Users can view their own tickets"
    ON public.tickets
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets"
    ON public.tickets
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets"
    ON public.tickets
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tickets"
    ON public.tickets
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES: ticket_files
-- ============================================================================

CREATE POLICY "Users can view files from their own tickets"
    ON public.ticket_files
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE tickets.id = ticket_files.ticket_id
            AND tickets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create files for their own tickets"
    ON public.ticket_files
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE tickets.id = ticket_files.ticket_id
            AND tickets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update files from their own tickets"
    ON public.ticket_files
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE tickets.id = ticket_files.ticket_id
            AND tickets.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE tickets.id = ticket_files.ticket_id
            AND tickets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete files from their own tickets"
    ON public.ticket_files
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE tickets.id = ticket_files.ticket_id
            AND tickets.user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: ticket_selections
-- ============================================================================

CREATE POLICY "Users can view selections from their own tickets"
    ON public.ticket_selections
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE tickets.id = ticket_selections.ticket_id
            AND tickets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create selections for their own tickets"
    ON public.ticket_selections
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE tickets.id = ticket_selections.ticket_id
            AND tickets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update selections from their own tickets"
    ON public.ticket_selections
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE tickets.id = ticket_selections.ticket_id
            AND tickets.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE tickets.id = ticket_selections.ticket_id
            AND tickets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete selections from their own tickets"
    ON public.ticket_selections
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE tickets.id = ticket_selections.ticket_id
            AND tickets.user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: selection_progress_snapshots
-- ============================================================================

CREATE POLICY "Users can view progress from their own selections"
    ON public.selection_progress_snapshots
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.ticket_selections
            JOIN public.tickets ON tickets.id = ticket_selections.ticket_id
            WHERE ticket_selections.id = selection_progress_snapshots.selection_id
            AND tickets.user_id = auth.uid()
        )
    );

-- Note: INSERT/UPDATE/DELETE for progress snapshots will be handled by server-side processes
-- Users should not write progress directly from the browser

-- ============================================================================
-- RLS POLICIES: Catalog tables (read-only for authenticated users)
-- ============================================================================

CREATE POLICY "Authenticated users can view teams"
    ON public.teams
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can view players"
    ON public.players
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can view matches"
    ON public.football_matches
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can view markets"
    ON public.markets
    FOR SELECT
    TO authenticated
    USING (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'User profiles with preferences and notification settings';
COMMENT ON TABLE public.tickets IS 'Betting tickets uploaded by users';
COMMENT ON TABLE public.ticket_files IS 'Screenshot or PDF files associated with tickets';
COMMENT ON TABLE public.teams IS 'Normalized catalog of football teams';
COMMENT ON TABLE public.players IS 'Normalized catalog of football players';
COMMENT ON TABLE public.football_matches IS 'Football matches referenced in tickets';
COMMENT ON TABLE public.markets IS 'Normalized catalog of betting markets';
COMMENT ON TABLE public.ticket_selections IS 'Individual selections within a ticket';
COMMENT ON TABLE public.selection_progress_snapshots IS 'Historical tracking of selection progress during live matches';

COMMENT ON COLUMN public.tickets.source_name IS 'Visual name of betting house from screenshot - NOT an integration';
COMMENT ON COLUMN public.ticket_files.storage_path IS 'Path to file in Supabase Storage bucket';
COMMENT ON COLUMN public.ticket_files.contains_personal_data IS 'Flag to mark files that should be deleted after processing';
COMMENT ON COLUMN public.football_matches.home_team_name IS 'Historical team name preserved from original ticket';
COMMENT ON COLUMN public.football_matches.away_team_name IS 'Historical team name preserved from original ticket';
COMMENT ON COLUMN public.ticket_selections.market_raw_text IS 'Original market text from ticket before normalization';
