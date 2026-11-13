import { expect, it } from 'vite-plus/test';
import { preparationDeadline } from './preparation.js';
import { emptyRoom } from './room.js';

it('全員が読み込み中でも準備待ちを開始から60秒で打ち切る', () => {
  const room = { ...emptyRoom('a'), phase: 'loading' as const };
  const deadline = preparationDeadline(room, 0, 100000);
  expect(deadline).toBe(160000);
  expect(preparationDeadline(room, deadline, 140000)).toBe(deadline);
  expect(preparationDeadline(room, deadline, 170000)).toBe(deadline);
});
it('最初の準備完了から15秒に短縮し、全体の60秒も超えない', () => {
  const room = { ...emptyRoom('a'), phase: 'loading' as const, ready: ['a'] };
  expect(preparationDeadline(room, 160000, 110000)).toBe(125000);
  expect(preparationDeadline(room, 125000, 120000)).toBe(125000);
  expect(preparationDeadline(room, 160000, 155000)).toBe(160000);
});
it('全員の準備完了後は準備待ちを予約しない', () => {
  expect(
    preparationDeadline({ ...emptyRoom('a'), phase: 'playing', ready: ['a'] }, 160000, 120000),
  ).toBe(0);
});
