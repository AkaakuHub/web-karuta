import { z } from 'zod';

export const roundResultSchema = z.object({ id: z.string(), owner: z.string().nullable() });
export type RoundResult = z.infer<typeof roundResultSchema>;
export type ResultGroup = 'mine' | 'opponent' | 'unclaimed';
export const soloPlayerId = 'solo';
const points = { correct: 1, incorrect: 0, unclaimed: 0 } as const;
export function scoreDelta(outcome: keyof typeof points): number {
  return points[outcome];
}
export function scoreTotal(results: readonly RoundResult[], player: string): number {
  return results.reduce(
    (score, result) => score + scoreDelta(result.owner === player ? 'correct' : 'unclaimed'),
    0,
  );
}
export function resultGroup(owner: string | null, you: string): ResultGroup {
  return owner === null ? 'unclaimed' : owner === you ? 'mine' : 'opponent';
}
