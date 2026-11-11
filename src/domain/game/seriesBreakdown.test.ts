import { expect, it } from 'vite-plus/test';
import { seriesBreakdown } from './seriesBreakdown.js';

it('シリーズごとの自分・相手・未取得を集計し横断曲を二重に数えない', () => {
  const series = [
    { id: 'a', name: 'A', color: '#f00000' },
    { id: 'b', name: 'B', color: '#0000f0' },
  ];
  const groups = seriesBreakdown(
    [
      { id: 'one', owner: 'me', seriesIds: ['a'] },
      { id: 'two', owner: 'other', seriesIds: ['a'] },
      { id: 'three', owner: null, seriesIds: ['a'] },
      { id: 'four', owner: 'me', seriesIds: ['b', 'a'] },
      { id: 'five', owner: 'other', seriesIds: ['a', 'b'] },
    ],
    series,
    'me',
  );
  expect(
    groups.map(({ mine, opponent, unclaimed, total }) => ({ mine, opponent, unclaimed, total })),
  ).toEqual([
    { mine: 1, opponent: 1, unclaimed: 1, total: 3 },
    { mine: 1, opponent: 1, unclaimed: 0, total: 2 },
  ]);
  expect(groups[1]?.colors).toEqual(['#f00000', '#0000f0']);
  expect(groups.reduce((sum, group) => sum + group.total, 0)).toBe(5);
});
