-- English team names (as read by OCR) so unlinked selections can be matched again once the match enters the data window.
ALTER TABLE public.ticket_selections
    ADD COLUMN home_team_english_name TEXT,
    ADD COLUMN away_team_english_name TEXT;

CREATE INDEX idx_ticket_selections_unlinked
    ON public.ticket_selections(created_at)
    WHERE match_id IS NULL;
