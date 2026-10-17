import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  apiEnvelopeSchema,
  toCompactFixture,
  type CompactFixture,
} from '@/lib/football/types';

export const PROVIDER = 'api-football';
const BASE_URL = 'https://v3.football.api-sports.io';
// El plan gratuito permite 100 consultas/día; se deja margen.
const DAILY_LIMIT = 90;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class QuotaExceededError extends Error {}
export class ProviderPlanError extends Error {}

export async function fetchFixturesByDate(date: string): Promise<CompactFixture[]> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    throw new Error('Falta API_FOOTBALL_KEY');
  }
  if (!DATE_PATTERN.test(date)) {
    throw new Error('Fecha inválida');
  }

  const admin = createAdminClient();
  const { data: used, error: usageError } = await admin.rpc('increment_api_usage', {
    p_provider: PROVIDER,
    p_day: new Date().toISOString().slice(0, 10),
  });
  if (usageError) {
    throw new Error(`No se pudo registrar el uso de la API: ${usageError.message}`);
  }
  if (typeof used === 'number' && used > DAILY_LIMIT) {
    throw new QuotaExceededError('Límite diario de consultas alcanzado');
  }

  const response = await fetch(`${BASE_URL}/fixtures?date=${date}`, {
    headers: { 'x-apisports-key': apiKey },
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`API-Football respondió ${response.status}`);
  }

  const envelope = apiEnvelopeSchema.parse(await response.json());
  const hasErrors = Array.isArray(envelope.errors)
    ? envelope.errors.length > 0
    : Object.keys(envelope.errors).length > 0;
  if (hasErrors) {
    throw new ProviderPlanError(JSON.stringify(envelope.errors));
  }

  return envelope.response
    .map(toCompactFixture)
    .filter((fixture): fixture is CompactFixture => fixture !== null);
}
