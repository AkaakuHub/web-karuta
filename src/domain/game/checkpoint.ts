import { z } from 'zod';
import { practiceModeSchema } from '../practice/model.js';
import { gameSessionSchema, type GameSession } from './session.js';

export const checkpointSchema = z
  .object({
    deckId: z.string(),
    mode: practiceModeSchema,
    session: gameSessionSchema,
  })
  .refine(({ session }) => {
    const { order, round, phase, results, board, reserve } = session;
    const remaining = [...board.filter((id) => id !== null), ...reserve];
    const pending = order.slice(results.length);
    return (
      phase !== 'complete' &&
      round < order.length &&
      results.length === round + Number(phase === 'revealed') &&
      new Set(order).size === order.length &&
      results.every((result, index) => result.id === order[index]) &&
      new Set(remaining).size === remaining.length &&
      remaining.length === pending.length &&
      pending.every((id) => remaining.includes(id))
    );
  }, '保存した練習の進行が一致しません');
export type GameCheckpoint = z.infer<typeof checkpointSchema>;

export function restoreSession(session: GameSession): GameSession {
  return {
    ...session,
    phase: session.phase === 'playing' ? 'ready' : session.phase,
    startedAt: null,
  };
}
