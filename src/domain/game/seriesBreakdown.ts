import type { RoundResult } from './results.js';

interface Series {
  id: string;
  name: string;
  color: string;
}
export interface SeriesSlice extends Series {
  value: number;
}
export interface PlayerSeries {
  id: string;
  name: string;
  total: number;
  slices: SeriesSlice[];
}

export function seriesBreakdown(
  results: readonly (RoundResult & { seriesIds: readonly string[] })[],
  series: readonly Series[],
  players: readonly { id: string; name: string }[],
): PlayerSeries[] {
  return players.map((player) => {
    const owned = results.filter((result) => result.owner === player.id);
    const counts = new Map<string, number>();
    for (const result of owned) {
      const ids = [...new Set(result.seriesIds)];
      if (!ids.length) throw new Error('曲のシリーズがありません');
      for (const id of ids) {
        if (!series.some((item) => item.id === id)) throw new Error('シリーズの情報がありません');
        counts.set(id, (counts.get(id) ?? 0) + 1 / ids.length);
      }
    }
    return {
      ...player,
      total: owned.length,
      slices: series
        .filter((item) => counts.has(item.id))
        .map((item) => ({ ...item, value: counts.get(item.id)! }))
        .sort((a, b) => b.value - a.value),
    };
  });
}

export function seriesGradient(slices: readonly SeriesSlice[]): string {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  let position = 0;
  return `conic-gradient(${slices
    .map((slice) => {
      const start = position;
      position += (slice.value / total) * 100;
      return `${slice.color} ${start}% ${position}%`;
    })
    .join(', ')})`;
}
