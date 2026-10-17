import type { CompactFixture } from '@/lib/football/types';

const STOP_WORDS = new Set([
  'fc', 'cf', 'sc', 'ac', 'as', 'afc', 'cd', 'ud', 'sd', 'de', 'del', 'la', 'el',
  'club', 'the', 'of', 'sa', 's', 'a', '1', 'town', 'city',
]);
// Nombres en español/inglés que la API escribe en el idioma local del club.
const TOKEN_ALIASES: Record<string, string> = {
  munich: 'munchen',
  cologne: 'koln',
  nuremberg: 'nurnberg',
};
const MIN_TEAM_SCORE = 0.7;
// Marcas de categoría: si la API las trae y el ticket no, es otro equipo (femenino, juvenil o filial).
const CATEGORY_TOKENS = new Set(['w', 'women', 'ii', 'iii', 'b', 'reserves', 'youth', 'castilla']);
const isCategoryToken = (token: string) => CATEGORY_TOKENS.has(token) || /^u\d{2}$/.test(token);
// Un nombre completo contenido en el otro ("Chico" en "Boyacá Chicó") cuenta como coincidencia fuerte.
const CONTAINMENT_SCORE = 0.75;
const AMBIGUITY_MARGIN = 0.05;

export function tokenize(name: string): string[] {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((token) => token.length > 0 && !STOP_WORDS.has(token))
    .map((token) => TOKEN_ALIASES[token] ?? token);
}

function tokensMatch(x: string, y: string): boolean {
  if (x === y) return true;
  return Math.min(x.length, y.length) >= 3 && (x.startsWith(y) || y.startsWith(x));
}

export function tokenScore(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const categoryA = a.filter(isCategoryToken).sort().join(',');
  const categoryB = b.filter(isCategoryToken).sort().join(',');
  if (categoryA !== categoryB) return 0;
  const matched = a.filter((x) => b.some((y) => tokensMatch(x, y))).length;
  const score = matched / Math.max(a.length, b.length);
  const isContained = matched === Math.min(a.length, b.length);
  return isContained ? Math.max(score, CONTAINMENT_SCORE) : score;
}

export type PreparedFixture = {
  fixture: CompactFixture;
  homeTokens: string[];
  awayTokens: string[];
};

export function prepareFixtures(fixtures: CompactFixture[]): PreparedFixture[] {
  return fixtures.map((fixture) => ({
    fixture,
    homeTokens: tokenize(fixture.homeName),
    awayTokens: tokenize(fixture.awayName),
  }));
}

function bestScore(candidates: string[], apiTokens: string[]): number {
  return Math.max(0, ...candidates.map((name) => tokenScore(tokenize(name), apiTokens)));
}

// Devuelve null si no hay coincidencia clara o si varios partidos empatan.
export function findFixture(
  homeNames: string[],
  awayNames: string[],
  prepared: PreparedFixture[]
): CompactFixture | null {
  const scored: { fixture: CompactFixture; score: number }[] = [];

  for (const item of prepared) {
    const home = bestScore(homeNames, item.homeTokens);
    const away = bestScore(awayNames, item.awayTokens);
    if (home >= MIN_TEAM_SCORE && away >= MIN_TEAM_SCORE) {
      scored.push({ fixture: item.fixture, score: home + away });
    }
  }

  if (scored.length === 0) return null;
  scored.sort((x, y) => y.score - x.score);
  const [best, second] = scored;
  if (second && best.score - second.score < AMBIGUITY_MARGIN) return null;
  return best.fixture;
}
