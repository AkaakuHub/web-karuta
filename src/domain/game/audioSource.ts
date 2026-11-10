export function sourceForRound<T>(sources: readonly T[], round: number): T | undefined {
  return sources.length ? sources[round % sources.length] : undefined;
}
