import { expect, it, vi } from 'vite-plus/test';
import { Storage } from '../../application/multiplayer/roomStorageHarness.js';
import { RoomPersistence } from './roomPersistence.js';
import { emptyRoom } from '../../domain/multiplayer/room.js';

function setup() {
  const storage = new Storage();
  const persistence = new RoomPersistence(storage);
  const state = { room: emptyRoom('host'), claims: null, expiresAt: 100000, loadingDeadline: 0 };
  return { storage, persistence, state };
}
it('同じ状態と同じ期限の保存で追加の書き込みをしない', async () => {
  const { storage, persistence, state } = setup();
  await persistence.load();
  await persistence.save(state);
  const writes = storage.writes.length;
  await persistence.save(structuredClone(state));
  expect(storage.writes).toHaveLength(writes);
  expect(storage.alarms).toEqual([100000]);
});
it('部屋だけが変わった場合に他の保存項目とアラームを書き直さない', async () => {
  const { storage, persistence, state } = setup();
  await persistence.load();
  await persistence.save(state);
  await persistence.save({ ...state, room: { ...state.room, round: 1 } });
  expect(Object.keys(storage.writes.at(-1)!)).toEqual(['room']);
  expect(storage.alarms).toEqual([100000]);
});
it('競合判定と音声準備では最も早い期限を設定し、処理後に有効期限へ戻す', async () => {
  const { storage, persistence, state } = setup();
  await persistence.load();
  await persistence.save({
    ...state,
    claims: { round: 0, deadline: 100, entries: [] },
    loadingDeadline: 200,
  });
  expect(storage.alarms).toEqual([100]);
  persistence.alarmFired();
  await persistence.save({ ...state, loadingDeadline: 200 });
  persistence.alarmFired();
  await persistence.save(state);
  expect(storage.alarms).toEqual([100, 200, 100000]);
});
it('休眠から読み直した状態でも不要な再保存をしない', async () => {
  const { storage, persistence, state } = setup();
  await persistence.load();
  await persistence.save(state);
  storage.writes = [];
  storage.alarms = [];
  const restored = new RoomPersistence(storage);
  await restored.load();
  await restored.save(state);
  expect(storage.writes).toEqual([]);
  expect(storage.alarms).toEqual([]);
});
it('期限切れの削除後は保存データと内部の比較状態を残さない', async () => {
  const { storage, persistence, state } = setup();
  await persistence.load();
  await persistence.save(state);
  await persistence.clear();
  expect(storage.values.size).toBe(0);
  await persistence.save(state);
  expect(storage.values.get('room')).toEqual(state.room);
});
it('保存だけでは常設タイマーを作らない', async () => {
  vi.useFakeTimers();
  try {
    const { persistence, state } = setup();
    await persistence.load();
    await persistence.save(state);
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    vi.useRealTimers();
  }
});

it('期限が未設定だった準備中の部屋にも一度だけ60秒の上限を設定する', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(100000);
  try {
    const { storage } = setup();
    storage.values.set('room', { ...emptyRoom('host'), phase: 'loading' });
    storage.values.set('expiresAt', 1000000);
    storage.values.set('loadingDeadline', 0);
    const first = await new RoomPersistence(storage).load();
    expect(first.loadingDeadline).toBe(160000);
    expect(storage.alarms).toEqual([160000]);
    const writes = storage.writes.length;
    await vi.advanceTimersByTimeAsync(10000);
    const second = await new RoomPersistence(storage).load();
    expect(second.loadingDeadline).toBe(160000);
    expect(storage.alarms).toEqual([160000]);
    expect(storage.writes).toHaveLength(writes);
  } finally {
    vi.useRealTimers();
  }
});
