import { expect, it, vi } from 'vite-plus/test';
import { TakeInput, type PendingTake } from './takeInput.js';

function setup() {
  const events: (PendingTake | null)[] = [];
  return { input: new TakeInput((event) => events.push(event)), events };
}
it('送信した瞬間に入力を確定し、連打を二重送信しない', () => {
  const { input, events } = setup();
  const transmit = vi.fn(() => true);
  expect(input.submit(2, 'card', transmit)).toBe(true);
  expect(events).toEqual([{ round: 2, id: 'card', accepted: false }]);
  expect(input.submit(2, 'other', transmit)).toBe(false);
  expect(transmit).toHaveBeenCalledTimes(1);
});
it('切断中や送信例外ではロックせず、復旧した同じターンで送信できる', () => {
  const { input, events } = setup();
  expect(input.submit(2, 'card', () => false)).toBe(false);
  expect(() =>
    input.submit(2, 'card', () => {
      throw new Error('closed');
    }),
  ).toThrow();
  expect(input.locked(2)).toBe(false);
  expect(events).toEqual([]);
  expect(input.submit(2, 'card', () => true)).toBe(true);
});
it('正解受付で直ちに反応し、重複・古い受付通知には反応しない', () => {
  const { input, events } = setup();
  input.submit(2, 'card', () => true);
  expect(input.accept(1)).toBe(false);
  expect(input.accept(2)).toBe(true);
  expect(events.at(-1)).toEqual({ round: 2, id: 'card', accepted: true });
  expect(input.accept(2)).toBe(false);
  expect(events).toHaveLength(2);
});
it('再同期後は判定待ちを解除し、古い受付通知でロックを戻さない', () => {
  const { input, events } = setup();
  input.submit(2, 'card', () => true);
  input.reset();
  expect(input.locked(2)).toBe(false);
  expect(events.at(-1)).toBeNull();
  expect(input.accept(2)).toBe(false);
  expect(input.submit(3, 'next', () => true)).toBe(true);
  expect(input.accept(2)).toBe(false);
});
it('100回の中断と復帰でも同じターンの操作が残らない', () => {
  const { input } = setup();
  for (let round = 0; round < 100; round++) {
    expect(input.submit(round, 'card', () => false)).toBe(false);
    expect(input.submit(round, 'card', () => true)).toBe(true);
    input.reset();
    expect(input.submit(round, 'card', () => true)).toBe(true);
    expect(input.accept(round)).toBe(true);
    input.reset();
    expect(input.locked(round)).toBe(false);
  }
});

it('受付拒否で同じターンの再入力を許可し、前のターンの拒否は無視する', () => {
  const { input, events } = setup();
  input.submit(2, 'card', () => true);
  expect(input.reject(1)).toBe(false);
  expect(input.locked(2)).toBe(true);
  expect(input.reject(2)).toBe(true);
  expect(events.at(-1)).toBeNull();
  expect(input.submit(2, 'card', () => true)).toBe(true);
});
