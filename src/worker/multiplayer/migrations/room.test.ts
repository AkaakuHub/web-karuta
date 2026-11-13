import { describe, expect, it } from 'vite-plus/test';
import { emptyRoom } from '../../../domain/multiplayer/room.js';
import { migrateRoom } from './room.js';

describe('保存済み対戦データの移行', () => {
  it('旧形式の進行、札、得点、参加情報を保持してお手上げ状態を追加する', () => {
    const current = {
      ...emptyRoom('host'),
      phase: 'playing' as const,
      round: 3,
      board: ['card'],
      order: ['one', 'two', 'three', 'card'],
      players: [{ id: 'host', name: '参加者', score: 2, connected: true }],
      results: [{ id: 'one', owner: 'host' }],
      blocked: ['guest'],
    };
    const { givenUp, ...legacy } = current;
    expect(givenUp).toEqual([]);
    expect(migrateRoom(legacy)).toEqual(current);
  });
  it('移行済みの申告を保持し、再度移行しても状態を変えない', () => {
    const room = { ...emptyRoom('host'), givenUp: ['guest'] };
    expect(migrateRoom(room)).toEqual(room);
    expect(migrateRoom(migrateRoom(room))).toEqual(room);
  });
});
