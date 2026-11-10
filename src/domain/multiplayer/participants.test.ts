import { describe, expect, it } from 'vite-plus/test';
import { disconnectPlayer, kickPlayer, waitingPlayers } from './participants.js';
import { beginGame, emptyRoom, readyPlayer } from './room.js';

function loading() {
  const room = emptyRoom('a');
  room.players = ['a', 'b', 'c'].map((id) => ({ id, name: id, score: 0, connected: true }));
  return readyPlayer(
    readyPlayer(
      beginGame(room, ['one', 'two'], 2, () => 0.5),
      'a',
      0,
    ),
    'b',
    1,
  );
}

describe('参加者の退出操作', () => {
  it('ホスト以外の操作と自分へのキックを拒否する', () => {
    const room = loading();
    expect(() => kickPlayer(room, 'b', 'c', 100)).toThrow();
    expect(() => kickPlayer(room, 'a', 'a', 100)).toThrow();
    expect(room.players.every((player) => player.connected)).toBe(true);
  });
  it('準備待ちの相手を退出させると、残った準備済みの2人で開始する', () => {
    const room = loading();
    const kicked = kickPlayer(room, 'a', 'c', 100);
    expect(kicked.phase).toBe('playing');
    expect(kicked.startsAt).toBe(100);
    expect(kicked.players.find((player) => player.id === 'c')?.connected).toBe(false);
    expect(kicked.order).toEqual(room.order);
    expect(kicked.results).toEqual(room.results);
  });
  it('切断時も同じ進行処理を使い、ホストを接続中の相手へ移す', () => {
    const room = loading();
    const disconnected = disconnectPlayer(room, 'a', 100);
    expect(disconnected.host).toBe('b');
    expect(disconnected.ready).toEqual(['b']);
    expect(disconnected.phase).toBe('loading');
  });
  it('準備済み・切断済み・退出済みの人を準備待ちに含めない', () => {
    const room = loading();
    const view = {
      ...room,
      players: room.players.map((player) => ({ ...player, removed: false })),
      total: 2,
      audio: '/audio',
      answer: null,
    };
    expect(waitingPlayers(view).map((player) => player.id)).toEqual(['c']);
    expect(
      waitingPlayers({
        ...view,
        players: view.players.map((player) => ({ ...player, removed: player.id === 'c' })),
      }),
    ).toEqual([]);
  });
});
