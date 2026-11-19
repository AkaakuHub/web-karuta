import { z } from 'zod';

export const roundResultSchema = z.object({ id: z.string(), owner: z.string().nullable() });
export type RoundResult = z.infer<typeof roundResultSchema>;
export type ResultGroup = 'mine' | 'opponent' | 'unclaimed';
export const soloPlayerId = 'solo';
export function correctCount(results: readonly RoundResult[], player: string): number {
  return results.reduce((count, result) => count + Number(result.owner === player), 0);
}
export function resultGroup(owner: string | null, you: string): ResultGroup {
  return owner === null ? 'unclaimed' : owner === you ? 'mine' : 'opponent';
}
