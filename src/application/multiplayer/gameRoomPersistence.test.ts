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
it.each(['lobby', 'loading'] as const)(
  '無人の期限切れ部屋（%s）を再保存せず削除する',
  async (phase) => {
    const storage = new Storage();
    storage.values.set('room', { ...emptyRoom('host'), phase });
    storage.values.set('expiresAt', 99999);
    storage.alarm = 99999;
    const room = await restore(storage);
    await room.alarm();
    await vi.advanceTimersByTimeAsync(86400000);
    expect(storage.values.size).toBe(0);
    expect(storage.deletions).toBe(1);
    expect(storage.writes).toEqual([]);
    expect(storage.alarms).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
  },
);
it('準備期限を過ぎた曲を一度だけ見送り次の曲の自動取得を始めない', async () => {
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
    phase: 'revealed',
    results: [{ id: 'one', owner: null }],
  });
  expect(storage.alarms).toEqual([86400000]);
  const writes = storage.writes.length;
  await vi.advanceTimersByTimeAsync(60000);
  expect(storage.writes).toHaveLength(writes);
  expect(vi.getTimerCount()).toBe(0);
});

it('受付済みの正解は次の通信もアラームも待たずに確定する', async () => {
  const storage = new Storage();
  storage.values.set('room', {
    ...emptyRoom('host'),
    phase: 'playing',
    startsAt: 90000,
    settling: true,
    players: [{ id: 'host', name: 'host', score: 0, connected: true }],
    ready: ['host'],
    board: ['one'],
    order: ['one'],
  });
  storage.values.set('claims', {
    round: 0,
    deadline: 100150,
    entries: [{ playerId: 'host', elapsedMs: 10000 }],
  });
  storage.values.set('expiresAt', 86400000);
  storage.alarm = 100150;
  await restore(storage);
  await vi.advanceTimersByTimeAsync(150);
  expect(storage.values.get('room')).toMatchObject({
    phase: 'revealed',
    winner: 'host',
    results: [{ id: 'one', owner: 'host' }],
  });
  expect(storage.values.get('claims')).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
  const writes = storage.writes.length;
  await vi.advanceTimersByTimeAsync(30000);
  expect(storage.writes).toHaveLength(writes);
});
