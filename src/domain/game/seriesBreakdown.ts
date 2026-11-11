import type { RoundResult } from './results.js';

interface Series {
  id: string;
  name: string;
  color: string;
}
export interface SeriesGroup {
  id: string;
  name: string;
  colors: string[];
  mine: number;
  opponent: number;
  unclaimed: number;
  total: number;
}

export function seriesBreakdown(
  results: readonly (RoundResult & { seriesIds: readonly string[] })[],
  series: readonly Series[],
  you: string,
): SeriesGroup[] {
  const groups = new Map<string, SeriesGroup>();
  for (const result of results) {
    const ids = [...new Set(result.seriesIds)].sort();
    if (!ids.length) throw new Error('曲のシリーズがありません');
    const definitions = ids.map((id) => {
      const definition = series.find((item) => item.id === id);
      if (!definition) throw new Error('シリーズの情報がありません');
      return definition;
    });
    const id = ids.join(':');
    const group = groups.get(id) ?? {
      id,
      name: definitions.map((item) => item.name).join('・'),
      colors: definitions.map((item) => item.color),
      mine: 0,
      opponent: 0,
      unclaimed: 0,
      total: 0,
    };
    group.total++;
    if (result.owner === null) group.unclaimed++;
    else if (result.owner === you) group.mine++;
    else group.opponent++;
    groups.set(id, group);
  }
  return [...groups.values()].sort((a, b) => b.total - a.total);
}
