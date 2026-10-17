-- Kickoff time stored on the selection because football_matches may be empty until a stats provider is integrated.
ALTER TABLE public.ticket_selections
    ADD COLUMN event_starts_at TIMESTAMPTZ;

CREATE INDEX idx_ticket_selections_event_starts_at
    ON public.ticket_selections(event_starts_at);
