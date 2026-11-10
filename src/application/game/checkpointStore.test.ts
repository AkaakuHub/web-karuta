import { describe, expect, it } from 'vite-plus/test';
import { GameCheckpointStore } from '../../infrastructure/game/checkpointStore.js';
import { createSession, nextRound, revealAnswer, startRound } from '../../domain/game/session.js';

function memoryStorage() {
  const values = new Map<string, string>();
  let writes = 0;
  return {
    get length() {
      return values.size;
    },
    get writes() {
      return writes;
    },
    key: (index: number) => [...values.keys()][index] ?? null,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      writes++;
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}

describe('デッキごとの練習記録', () => {
  it('デッキを切り替えて再読み込みしても、それぞれの続きが残る', () => {
    const storage = memoryStorage();
    const first = createSession(['a', 'b'], 2, 2, () => 0.5);
    const second = createSession(['c', 'd'], 2, 2, () => 0.5);
    const store = new GameCheckpointStore(storage, 'test-solo-game');
    store.save('first', 'all', first);
    store.save('second', 'weak', second);
    const reloaded = new GameCheckpointStore(storage, 'test-solo-game');
    expect(reloaded.snapshot.saved.first?.session.order).toEqual(first.order);
    expect(reloaded.snapshot.saved.second?.session.order).toEqual(second.order);
    expect(reloaded.snapshot.latestDeckId).toBe('second');
    reloaded.save('first', 'all', first);
    const complete = nextRound(
      revealAnswer(
        startRound(
          createSession(['a'], 1, 1, () => 0.5),
          0,
        ),
        100,
      ),
    );
    reloaded.save('first', 'all', complete);
    const finished = new GameCheckpointStore(storage, 'test-solo-game');
    expect(finished.snapshot.saved.first).toBeUndefined();
    expect(finished.snapshot.saved.second?.mode).toBe('weak');
  });
  it('直前の保存形式を変えずに読み、同じ進行を保存し直さない', () => {
    const storage = memoryStorage();
    const session = createSession(['a'], 1, 1, () => 0.5);
    const raw = JSON.stringify({ deckId: 'first', mode: 'all', session });
    storage.setItem('test-solo-game', raw);
    const writes = storage.writes;
    const store = new GameCheckpointStore(storage, 'test-solo-game');
    expect(store.snapshot.saved.first?.session.order).toEqual(['a']);
    store.save('first', 'all', session);
    expect(storage.writes).toBe(writes);
    expect(storage.getItem('test-solo-game')).toBe(raw);
  });
  it('破損した記録を自動で削除せず、ほかのデッキは読み込む', () => {
    const storage = memoryStorage();
    storage.setItem('test-solo-game:broken', '{');
    const store = new GameCheckpointStore(storage, 'test-solo-game');
    expect(store.snapshot.invalidDeckIds).toEqual(['broken']);
    expect(storage.getItem('test-solo-game:broken')).toBe('{');
  });
});
