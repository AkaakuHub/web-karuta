import { correctCount, type RoundResult } from './results.js';

export function rankPlayers<Player extends { id: string; name: string }>(
  players: readonly Player[],
  results: readonly RoundResult[],
) {
  const ranked = players
    .map((player) => ({ ...player, count: correctCount(results, player.id) }))
    .sort((a, b) => b.count - a.count);
  let rank = 0;
  return ranked.map((player, index) => {
    if (index === 0 || player.count !== ranked[index - 1]?.count) rank = index + 1;
    return { ...player, rank };
  });
}
