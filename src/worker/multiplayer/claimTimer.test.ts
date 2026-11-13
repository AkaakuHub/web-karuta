import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test';
import { ClaimTimer } from './claimTimer.js';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(100000);
});
afterEach(() => vi.useRealTimers());
it('他の通信やアラームがなくても受付期限に一度だけ判定する', async () => {
  const settle = vi.fn(async () => {});
  const timer = new ClaimTimer(settle);
  timer.schedule(100150);
  await vi.advanceTimersByTimeAsync(100);
  timer.schedule(100150);
  await vi.advanceTimersByTimeAsync(49);
  expect(settle).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  expect(settle).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(60000);
  expect(settle).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});
it('確定・中断後にタイマーを残さず無人時には起動しない', async () => {
  const settle = vi.fn(async () => {});
  const timer = new ClaimTimer(settle);
  timer.schedule(null);
  expect(vi.getTimerCount()).toBe(0);
  timer.schedule(100150);
  timer.schedule(null);
  await vi.advanceTimersByTimeAsync(1000);
  expect(settle).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});
it('復元時に期限が過ぎていた判定を直ちに進める', async () => {
  const settle = vi.fn(async () => {});
  new ClaimTimer(settle).schedule(99999);
  await vi.advanceTimersByTimeAsync(0);
  expect(settle).toHaveBeenCalledTimes(1);
});
