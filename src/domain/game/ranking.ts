import { scoreTotal, type RoundResult } from './results.js';

export function rankPlayers(
  players: readonly { id: string; name: string }[],
  results: readonly RoundResult[],
) {
  const ranked = players
    .map((player) => ({ ...player, count: scoreTotal(results, player.id) }))
    .sort((a, b) => b.count - a.count);
  let rank = 0;
  return ranked.map((player, index) => {
    if (index === 0 || player.count !== ranked[index - 1]?.count) rank = index + 1;
    return { ...player, rank };
  });
}
