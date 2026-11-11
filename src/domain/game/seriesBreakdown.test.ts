import { expect, it } from 'vite-plus/test';
import { seriesBreakdown } from './seriesBreakdown.js';

it('プレイヤーごとに取得した札だけを分類し横断曲の割合を均等に配分する', () => {
  const series = [
    { id: 'a', name: 'A', color: '#f00000' },
    { id: 'b', name: 'B', color: '#0000f0' },
  ];
  const players = [
    { id: 'me', name: '自分' },
    { id: 'other', name: '相手' },
    { id: 'zero', name: '未取得の人' },
  ];
  const charts = seriesBreakdown(
    [
      { id: 'one', owner: 'me', seriesIds: ['a'] },
      { id: 'two', owner: 'other', seriesIds: ['b'] },
      { id: 'three', owner: null, seriesIds: ['a'] },
      { id: 'four', owner: 'me', seriesIds: ['b', 'a'] },
    ],
    series,
    players,
  );
  expect(charts.map((chart) => chart.total)).toEqual([2, 1, 0]);
  expect(charts[0]?.slices.map(({ id, value }) => ({ id, value }))).toEqual([
    { id: 'a', value: 1.5 },
    { id: 'b', value: 0.5 },
  ]);
  expect(charts[1]?.slices.map(({ id, value }) => ({ id, value }))).toEqual([
    { id: 'b', value: 1 },
  ]);
  expect(charts[0]?.slices.map(({ count }) => count)).toEqual([2, 1]);
  expect(charts[2]?.slices).toEqual([]);
});
