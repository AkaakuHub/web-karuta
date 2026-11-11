import { expect, it } from 'vite-plus/test';
import { claimAllowance, validClaimTime, winningClaim } from './claimTiming.js';

it('通信の到着順が逆でも、音声を聞いてから早く反応した人を選ぶ', () => {
  const claims = [
    { playerId: 'fast-network', elapsedMs: 600 },
    { playerId: 'mobile-network', elapsedMs: 500 },
  ];
  expect(validClaimTime(600, 1000, 1620, claimAllowance([40, 40]))).toBe(true);
  expect(validClaimTime(500, 1000, 1700, claimAllowance([400, 400]))).toBe(true);
  expect(winningClaim(claims, () => 0)).toBe('mobile-network');
  expect(winningClaim(claims.toReversed(), () => 0)).toBe('mobile-network');
});

it('最速の1人だけを選び、完全に同じ時刻の場合も1人にだけ確定する', () => {
  const equal = [
    { playerId: 'a', elapsedMs: 500 },
    { playerId: 'b', elapsedMs: 500 },
  ];
  expect(winningClaim(equal, () => 0)).toBe('a');
  expect(winningClaim(equal, () => 0.99)).toBe('b');
  expect(
    winningClaim(
      [
        { playerId: 'a', elapsedMs: 500 },
        { playerId: 'b', elapsedMs: 500.01 },
      ],
      () => 0.99,
    ),
  ).toBe('a');
  expect(winningClaim([], () => 0)).toBeNull();
});

it('未来・開始前・測定した通信時間を超える不自然な巻き戻しを拒否する', () => {
  const allowance = claimAllowance([40, 50, 45]);
  expect(validClaimTime(-1, 1000, 1600, allowance)).toBe(false);
  expect(validClaimTime(500, 1000, 900, allowance)).toBe(false);
  expect(validClaimTime(900, 1000, 1600, allowance)).toBe(false);
  expect(validClaimTime(1, 1000, 1600, allowance)).toBe(false);
  expect(validClaimTime(Number.NaN, 1000, 1600, allowance)).toBe(false);
  expect(claimAllowance([100, 400, 120])).toBeGreaterThan(claimAllowance([100, 100, 100]));
  expect(claimAllowance([100, 10000])).toBe(1500);
  expect(() => claimAllowance([100])).toThrow();
});
