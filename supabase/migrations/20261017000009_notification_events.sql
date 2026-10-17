-- Notification events: history plus de-duplication (one push per event). Written by the server; users read their own.
CREATE TABLE public.notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    selection_id UUID REFERENCES public.ticket_selections(id) ON DELETE CASCADE,
    match_id UUID REFERENCES public.football_matches(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT notification_events_kind_check CHECK (kind IN (
        'match_start', 'selection_reached', 'selection_lost', 'ticket_won', 'ticket_lost'
    )),
    CONSTRAINT notification_events_unique UNIQUE NULLS NOT DISTINCT (user_id, kind, ticket_id, selection_id, match_id)
);

CREATE INDEX idx_notification_events_user_created ON public.notification_events(user_id, created_at DESC);

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification events"
    ON public.notification_events
    FOR SELECT
    USING (auth.uid() = user_id);
