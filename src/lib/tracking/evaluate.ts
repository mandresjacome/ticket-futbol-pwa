import type { SelectionProgress, SelectionStatus } from '@/types';
import { tokenScore, tokenize } from '@/lib/football/team-matching';

export type MatchSnapshot = {
  homeName: string;
  awayName: string;
  // Estado de football_matches.status
  status: string;
  minute: number | null;
  homeScore: number | null;
  awayScore: number | null;
};

export type SelectionToEvaluate = {
  marketCode: string | null;
  label: string;
  line: number | null;
  homeName: string | null;
  awayName: string | null;
  match: MatchSnapshot;
};

export type Evaluation = {
  status: SelectionStatus;
  progress?: SelectionProgress;
};

type Outcome = 'home' | 'draw' | 'away';
type Phase = 'upcoming' | 'live' | 'finished' | 'review';
type Verdict = 'win' | 'lose' | 'push';

const LIVE_STATUSES = new Set(['first_half', 'halftime', 'second_half', 'extra_time', 'penalties']);
const REVIEW_STATUSES = new Set(['postponed', 'cancelled', 'suspended']);
const MIN_NAME_SCORE = 0.7;

const plain = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

function phaseOf(status: string): Phase {
  if (status === 'finished') return 'finished';
  if (LIVE_STATUSES.has(status)) return 'live';
  if (REVIEW_STATUSES.has(status)) return 'review';
  return 'upcoming';
}

function outcomeNow(home: number, away: number): Outcome {
  if (home > away) return 'home';
  if (home < away) return 'away';
  return 'draw';
}

function resolveOutcome(text: string, s: SelectionToEvaluate): Outcome | null {
  const simple = plain(text).replace(/[^a-z0-9]+/g, ' ').trim();
  if (['empate', 'draw', 'x'].includes(simple)) return 'draw';
  if (['1', 'local', 'home'].includes(simple)) return 'home';
  if (['2', 'visitante', 'away'].includes(simple)) return 'away';

  const tokens = tokenize(text);
  const best = (names: (string | null)[]) =>
    Math.max(
      0,
      ...names.filter((n): n is string => Boolean(n)).map((n) => tokenScore(tokens, tokenize(n)))
    );
  const home = best([s.match.homeName, s.homeName]);
  const away = best([s.match.awayName, s.awayName]);
  if (home >= MIN_NAME_SCORE && home > away) return 'home';
  if (away >= MIN_NAME_SCORE && away > home) return 'away';
  return null;
}

function parseLine(s: SelectionToEvaluate): number | null {
  if (s.line !== null) return s.line;
  const found = s.label.match(/(\d+(?:[.,]\d+)?)/);
  return found ? Number(found[1].replace(',', '.')) : null;
}

function minuteText(s: SelectionToEvaluate): string {
  return s.match.minute !== null ? ` (min ${s.match.minute}')` : '';
}

function scoreText(s: SelectionToEvaluate, home: number, away: number): string {
  return `${s.match.homeName} ${home} - ${away} ${s.match.awayName}${minuteText(s)}`;
}

// Resultado final de la selección una vez terminado el partido.
function finishedStatus(verdict: Verdict): SelectionStatus {
  if (verdict === 'win') return 'target_reached';
  if (verdict === 'lose') return 'lost';
  return 'void';
}

// Para mercados que se deciden al final: en juego, indica si "por ahora" se cumple.
function settleAtEnd(
  phase: Phase,
  verdict: Verdict,
  winningNow: boolean,
  progress: SelectionProgress
): Evaluation {
  if (phase === 'finished') return { status: finishedStatus(verdict), progress };
  return { status: winningNow ? 'currently_winning' : 'live_tracking', progress };
}

function progress(current: number, target: number, unit: string, message: string, isOnTrack = false): SelectionProgress {
  return { current, target, unit, message, isOnTrack };
}

function evaluateWinner(s: SelectionToEvaluate, phase: Phase, h: number, a: number): Evaluation | null {
  const pick = resolveOutcome(s.label, s);
  if (!pick) return null;
  const now = outcomeNow(h, a);
  return settleAtEnd(phase, now === pick ? 'win' : 'lose', now === pick, progress(h, a, 'goles', scoreText(s, h, a)));
}

function parseDoubleChance(s: SelectionToEvaluate): Set<Outcome> | null {
  const simple = plain(s.label).replace(/\s+/g, '');
  if (simple === '1x' || simple === 'x1') return new Set<Outcome>(['home', 'draw']);
  if (simple === 'x2' || simple === '2x') return new Set<Outcome>(['draw', 'away']);
  if (simple === '12' || simple === '21') return new Set<Outcome>(['home', 'away']);

  const outcomes = s.label
    .split(/\s+(?:o|or|y)\s+|\s*\/\s*/i)
    .map((part) => resolveOutcome(part, s));
  if (outcomes.some((o) => o === null)) return null;
  const set = new Set(outcomes as Outcome[]);
  return set.size >= 2 ? set : null;
}

function evaluateDoubleChance(s: SelectionToEvaluate, phase: Phase, h: number, a: number): Evaluation | null {
  const covered = parseDoubleChance(s);
  if (!covered) return null;
  const inSet = covered.has(outcomeNow(h, a));
  return settleAtEnd(phase, inSet ? 'win' : 'lose', inSet, progress(h, a, 'goles', scoreText(s, h, a)));
}

function evaluateTotalGoals(s: SelectionToEvaluate, phase: Phase, h: number, a: number): Evaluation | null {
  const line = parseLine(s);
  const text = plain(s.label);
  const isUnder = /\b(menos|under)\b/.test(text);
  const isOver = /\b(mas|over)\b/.test(text) || text.startsWith('+');
  if (line === null || isUnder === isOver) return null;

  const total = h + a;
  const side = isOver ? 'más' : 'menos';
  const message = `Van ${total} ${total === 1 ? 'gol' : 'goles'}; se necesitan ${side} de ${line}${minuteText(s)}`;

  if (isOver) {
    const target = Math.floor(line) + 1;
    if (total > line) return { status: 'target_reached', progress: progress(total, target, 'goles', message) };
    if (phase === 'finished') {
      return { status: finishedStatus(total === line ? 'push' : 'lose'), progress: progress(total, target, 'goles', message) };
    }
    return { status: 'live_tracking', progress: progress(total, target, 'goles', message, true) };
  }

  const limit = Math.floor(line);
  if (total > line) return { status: 'lost', progress: progress(total, limit, 'goles', message) };
  const verdict: Verdict = total === line ? 'push' : 'win';
  return settleAtEnd(phase, verdict, true, progress(total, limit, 'goles', message));
}

function evaluateBtts(s: SelectionToEvaluate, phase: Phase, h: number, a: number): Evaluation | null {
  const words = plain(s.label).replace(/[^a-z]+/g, ' ').split(' ');
  const yes = words.includes('si') || words.includes('yes');
  const no = words.includes('no');
  if (yes === no) return null;

  const both = h > 0 && a > 0;
  const message = both ? `Ambos equipos ya marcaron. ${scoreText(s, h, a)}` : scoreText(s, h, a);
  const bar = progress(Number(h > 0) + Number(a > 0), 2, 'equipos', message, yes && !both);

  if (yes) {
    if (both) return { status: 'target_reached', progress: bar };
    return { status: phase === 'finished' ? 'lost' : 'live_tracking', progress: bar };
  }
  if (both) return { status: 'lost', progress: bar };
  return settleAtEnd(phase, 'win', true, bar);
}

// Solo hándicap de 2 vías con signo en la etiqueta (por ejemplo "Real Betis +1.5").
function evaluateHandicap(s: SelectionToEvaluate, phase: Phase, h: number, a: number): Evaluation | null {
  const found = s.label.match(/([+-])\s?(\d+(?:[.,]\d+)?)/);
  if (!found) return null;
  const handicap = Number(found[2].replace(',', '.')) * (found[1] === '-' ? -1 : 1);
  if ((handicap * 2) % 1 !== 0) return null;

  const pick = resolveOutcome(s.label.replace(found[0], ' '), s);
  if (pick !== 'home' && pick !== 'away') return null;

  const adjusted = (pick === 'home' ? h - a : a - h) + handicap;
  const verdict: Verdict = adjusted > 0 ? 'win' : adjusted < 0 ? 'lose' : 'push';
  return settleAtEnd(phase, verdict, adjusted > 0, progress(h, a, 'goles', scoreText(s, h, a)));
}

// Devuelve null si el mercado todavía no se puede estimar (córners, tarjetas, jugadores...).
export function evaluateSelection(s: SelectionToEvaluate): Evaluation | null {
  const supported = ['match_winner', 'double_chance', 'total_goals', 'both_teams_to_score', 'handicap'];
  if (!s.marketCode || !supported.includes(s.marketCode)) return null;

  const phase = phaseOf(s.match.status);
  if (phase === 'upcoming') return { status: 'upcoming' };
  if (phase === 'review') {
    return {
      status: 'needs_review',
      progress: progress(0, 0, '', 'El partido fue pospuesto, cancelado o suspendido. Confirma con tu casa de apuestas.'),
    };
  }

  const h = s.match.homeScore ?? 0;
  const a = s.match.awayScore ?? 0;

  switch (s.marketCode) {
    case 'match_winner':
      return evaluateWinner(s, phase, h, a);
    case 'double_chance':
      return evaluateDoubleChance(s, phase, h, a);
    case 'total_goals':
      return evaluateTotalGoals(s, phase, h, a);
    case 'both_teams_to_score':
      return evaluateBtts(s, phase, h, a);
    case 'handicap':
      return evaluateHandicap(s, phase, h, a);
    default:
      return null;
  }
}
