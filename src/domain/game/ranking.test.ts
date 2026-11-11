import { expect, it } from 'vite-plus/test';
import { rankPlayers } from './ranking.js';

it('取得枚数順に並べ、同点は同順位と入室順を保つ', () => {
  const players = ['a', 'b', 'c'].map((id) => ({ id, name: id }));
  const ranked = rankPlayers(players, [
    { id: 'one', owner: 'c' },
    { id: 'two', owner: 'b' },
    { id: 'three', owner: 'c' },
    { id: 'four', owner: null },
  ]);
  expect(ranked.map(({ id, rank, count }) => ({ id, rank, count }))).toEqual([
    { id: 'c', rank: 1, count: 2 },
    { id: 'b', rank: 2, count: 1 },
    { id: 'a', rank: 3, count: 0 },
  ]);
  expect(rankPlayers(players, []).map(({ id, rank }) => ({ id, rank }))).toEqual([
    { id: 'a', rank: 1 },
    { id: 'b', rank: 1 },
    { id: 'c', rank: 1 },
  ]);
});
