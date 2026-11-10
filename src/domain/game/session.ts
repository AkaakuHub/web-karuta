import { pauseQuestion } from './timing.js';
import { z } from 'zod';
import { soloPlayerId, roundResultSchema } from './results.js';
export const gameSessionSchema = z.object({
  board: z.array(z.string().nullable()),
  reserve: z.array(z.string()),
  lastTaken: z
    .object({
      songId: z.string(),
      slot: z.number().int().nonnegative(),
      kind: z.enum(['correct', 'skipped']),
    })
    .nullable(),
  order: z.array(z.string()).min(1),
  round: z.number().int().nonnegative(),
  phase: z.enum(['ready', 'playing', 'revealed', 'complete']),
  results: z.array(roundResultSchema),
  incorrect: z.array(z.string()),
  mistakes: z.number().int().nonnegative(),
  times: z.array(z.number().nonnegative()),
  startedAt: z.number().nonnegative().nullable(),
  elapsedMs: z.number().nonnegative(),
  roundElapsedMs: z.number().nonnegative(),
  skipped: z.number().int().nonnegative(),
});
export type GameSession = z.infer<typeof gameSessionSchema>;

export interface GameFeedback {
  id: number;
  kind: 'correct' | 'incorrect' | 'skipped' | 'complete';
  time: number | null;
  winner?: string;
  opponent?: boolean;
}

export function canSeekRound(session: GameSession): boolean {
  return session.phase === 'revealed';
}

function shuffle<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    const current = result[index];
    const replacement = result[other];
    if (current !== undefined && replacement !== undefined) {
      result[index] = replacement;
      result[other] = current;
    }
  }
  return result;
}

export function createSession(
  ids: readonly string[],
  size: number,
  capacity: number,
  random: () => number,
): GameSession {
  const selected = shuffle([...new Set(ids)], random).slice(0, size);
  if (!selected.length) throw new Error('出題対象の楽曲がありません');
  if (!Number.isInteger(capacity) || capacity < 1) throw new Error('札の表示領域がありません');
  const board = selected.slice(0, capacity);
  const reserve = selected.slice(capacity);
  const live: (string | null)[] = [...board];
  const remaining = [...reserve];
  const order: string[] = [];
  while (live.some((id) => id !== null)) {
    const slots = live.flatMap((id, index) => (id === null ? [] : [index]));
    const slot = slots[Math.floor(random() * slots.length)];
    const id = slot === undefined ? undefined : live[slot];
    if (slot === undefined || !id) throw new Error('出題する札を選べません');
    order.push(id);
    live[slot] = remaining.shift() ?? null;
  }
  return {
    board,
    reserve,
    lastTaken: null,
    order,
    round: 0,
    phase: 'ready',
    results: [],
    incorrect: [],
    mistakes: 0,
    times: [],
    startedAt: null,
    elapsedMs: 0,
    roundElapsedMs: 0,
    skipped: 0,
  };
}

function retire(session: GameSession, songId: string, kind: 'correct' | 'skipped') {
  const slot = session.board.indexOf(songId);
  if (slot < 0) throw new Error('出題した札が場にありません');
  const board = [...session.board];
  board[slot] = session.reserve[0] ?? null;
  return { board, reserve: session.reserve.slice(1), lastTaken: { songId, slot, kind } };
}

export function startRound(session: GameSession, now: number): GameSession {
  if (session.phase !== 'ready') return session;
  return { ...session, phase: 'playing', startedAt: now };
}

export function takeCard(session: GameSession, id: string, now: number): GameSession {
  if (
    session.phase !== 'playing' ||
    session.results.some((result) => result.id === id) ||
    session.incorrect.includes(id) ||
    !session.board.includes(id)
  )
    return session;
  const timed = pauseQuestion(session, now);
  if (id !== session.order[session.round])
    return {
      ...timed,
      startedAt: session.startedAt === null ? null : now,
      incorrect: [...session.incorrect, id],
      mistakes: session.mistakes + 1,
    };
  return {
    ...timed,
    ...retire(session, id, 'correct'),
    phase: 'revealed',
    results: [...session.results, { id, owner: soloPlayerId }],
    times: [...session.times, timed.roundElapsedMs],
  };
}

export function revealAnswer(session: GameSession, now: number): GameSession {
  if (session.phase !== 'playing') return session;
  const answer = session.order[session.round];
  if (!answer) throw new Error('出題がありません');
  return {
    ...pauseQuestion(session, now),
    ...retire(session, answer, 'skipped'),
    phase: 'revealed',
    results: [...session.results, { id: answer, owner: null }],
    skipped: session.skipped + 1,
  };
}

export function nextRound(session: GameSession): GameSession {
  if (session.phase !== 'revealed') return session;
  const round = session.round + 1;
  return {
    ...session,
    round,
    phase: round >= session.order.length ? 'complete' : 'ready',
    incorrect: [],
    startedAt: null,
    roundElapsedMs: 0,
    lastTaken: null,
  };
}
