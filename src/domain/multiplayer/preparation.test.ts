import { expect, it } from 'vite-plus/test';
import { preparationDeadline } from './preparation.js';
import { emptyRoom } from './room.js';

it('80秒かかる音声取得でも最初の準備完了から待ち時間を数える', () => {
  const room = { ...emptyRoom('a'), phase: 'loading' as const };
  expect(preparationDeadline(room, 0, 0)).toBe(0);
  expect(preparationDeadline(room, 0, 80000)).toBe(0);
  const ready = { ...room, ready: ['a'] };
  const deadline = preparationDeadline(ready, 0, 80000);
  expect(deadline).toBe(95000);
  expect(preparationDeadline(ready, deadline, 90000)).toBe(deadline);
});
it('準備済みの全員が切断した場合と出題開始後は準備待ちを予約しない', () => {
  expect(preparationDeadline({ ...emptyRoom('a'), phase: 'loading' }, 95000, 90000)).toBe(0);
  expect(
    preparationDeadline({ ...emptyRoom('a'), phase: 'playing', ready: ['a'] }, 95000, 90000),
  ).toBe(0);
});
