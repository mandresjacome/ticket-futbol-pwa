-- Server-only tables for the stats provider: request counter and per-day fixture cache.
-- RLS is enabled with no policies, so only the service role can read or write them.

CREATE TABLE public.api_usage (
    provider TEXT NOT NULL,
    day DATE NOT NULL,
    requests INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (provider, day)
);

CREATE TABLE public.api_fixture_day_cache (
    provider TEXT NOT NULL,
    day DATE NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fixtures JSONB NOT NULL,
    PRIMARY KEY (provider, day)
);

ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_fixture_day_cache ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.increment_api_usage(p_provider TEXT, p_day DATE)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    INSERT INTO public.api_usage (provider, day, requests)
    VALUES (p_provider, p_day, 1)
    ON CONFLICT (provider, day)
    DO UPDATE SET requests = public.api_usage.requests + 1
    RETURNING requests;
$$;

REVOKE ALL ON FUNCTION public.increment_api_usage(TEXT, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_api_usage(TEXT, DATE) TO service_role;
