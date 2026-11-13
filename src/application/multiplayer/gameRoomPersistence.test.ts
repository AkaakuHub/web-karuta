import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test';
import { GameRoom } from '../../worker/multiplayer/gameRoom.js';
import type { RoomContext } from '../../worker/multiplayer/roomIdentity.js';
import { emptyRoom } from '../../domain/multiplayer/room.js';
import { Storage } from './roomStorageHarness.js';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(100000);
  vi.stubGlobal(
    'WebSocketRequestResponsePair',
    class {
      constructor(
        readonly request: string,
        readonly response: string,
      ) {}
    },
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function restore(storage: Storage) {
  let initializing: Promise<unknown> = Promise.resolve();
  const context: RoomContext = {
    storage,
    blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T> {
      const pending = callback();
      initializing = pending;
      return pending;
    },
    getWebSockets: () => [],
    acceptWebSocket: () => {},
    setWebSocketAutoResponse: () => {},
  };
  const room = new GameRoom(context, { deckIds: () => [], audioFor: () => 'audio' });
  await initializing;
  return room;
}
it('無人の期限切れ部屋を削除し、アラームやタイマーを繰り返さない', async () => {
  const storage = new Storage();
  storage.values.set('room', emptyRoom('host'));
  storage.values.set('expiresAt', 99999);
  storage.alarm = 99999;
  const room = await restore(storage);
  await room.alarm();
  await vi.advanceTimersByTimeAsync(86400000);
  expect(storage.values.size).toBe(0);
  expect(storage.deletions).toBe(1);
  expect(storage.alarms).toEqual([]);
  expect(vi.getTimerCount()).toBe(0);
});
it('準備前の古いアラームが届いても出題を進めず保存期限まで起動を予約しない', async () => {
  const storage = new Storage();
  storage.values.set('room', {
    ...emptyRoom('host'),
    phase: 'loading',
    board: ['one'],
    order: ['one'],
  });
  storage.values.set('expiresAt', 86400000);
  storage.values.set('loadingDeadline', 99999);
  storage.alarm = 99999;
  const room = await restore(storage);
  await room.alarm();
  expect(storage.values.get('room')).toMatchObject({
    phase: 'loading',
    results: [],
  });
  expect(storage.alarms).toEqual([86400000]);
  const writes = storage.writes.length;
  await vi.advanceTimersByTimeAsync(60000);
  expect(storage.writes).toHaveLength(writes);
  expect(vi.getTimerCount()).toBe(0);
});
