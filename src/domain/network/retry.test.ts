import { expect, it } from 'vite-plus/test';
import { retryDelay, RetryBudget, retryAfter } from './retry.js';

it('再試行は分散させながら増やし、最大60秒に制限する', () => {
  expect(retryDelay(0, 1000, 0)).toBe(500);
  expect(retryDelay(0, 1000, 1)).toBe(1000);
  expect(retryDelay(3, 1000, 1)).toBe(8000);
  expect(retryDelay(1000, 1000, 1)).toBe(60000);
  expect(retryDelay(1000, 1000, 0)).toBe(30000);
});

it('一時障害の自動再試行は3回で止まり、明示的な再試行で再開する', () => {
  const budget = new RetryBudget(3, 5000);
  expect(budget.next(false)).toBeNull();
  for (let index = 0; index < 3; index++) expect(budget.next(true)).toBeGreaterThan(0);
  expect(budget.next(true)).toBeNull();
  budget.reset();
  expect(budget.next(true)).toBeGreaterThan(0);
});
it('サーバーの再試行待機指定を秒数と日時の両方で扱う', () => {
  expect(retryAfter('25', 0)).toBe(25000);
  expect(retryAfter('Thu, 01 Jan 1970 00:01:00 GMT', 10000)).toBe(50000);
  expect(retryAfter(null, 0)).toBeUndefined();
  expect(retryAfter('invalid', 0)).toBeUndefined();
});
