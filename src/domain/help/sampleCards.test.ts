import { expect, it } from 'vite-plus/test';
import { sampleHelpCards } from './sampleCards.js';

it('見本の札を重複なくランダムに選び、入力の並びや再表示で配置を変えない', () => {
  const cards = Array.from({ length: 100 }, (_, index) => ({ id: String(index), value: index }));
  const before = [...cards];
  const sample = sampleHelpCards(cards);
  expect(sample).toHaveLength(30);
  expect(new Set(sample.map((card) => card.id)).size).toBe(30);
  expect(sample).not.toEqual(cards.slice(0, 30));
  expect(sampleHelpCards(cards)).toEqual(sample);
  expect(sampleHelpCards(cards.toReversed())).toEqual(sample);
  expect(cards).toEqual(before);
});
