import { describe, expect, it } from 'vite-plus/test';
import { beginGame, claimCard, emptyRoom, prepareRound, readyPlayer, skipRound } from './room.js';

function playing() {
  const room = emptyRoom('a');
  room.players = ['a', 'b'].map((id) => ({ id, name: id, score: 0, connected: true }));
  return readyPlayer(
    readyPlayer(
      beginGame(room, ['one', 'two', 'three'], 3, () => 0.4),
      'a',
      0,
    ),
    'b',
    100,
  );
}
describe('オンライン対戦の取得判定', () => {
  it('デッキ全体を出題し、取得した位置へ控えの札を補充する', () => {
    const base = emptyRoom('a');
    base.players = ['a', 'b'].map((id) => ({ id, name: id, score: 0, connected: true }));
    let room = beginGame(base, ['one', 'two', 'three', 'four', 'five'], 2, () => 0.4);
    expect(room.order.length).toBe(5);
    expect(room.board.length).toBe(2);
    for (let round = 0; round < 5; round++) {
      room = readyPlayer(readyPlayer(room, 'a', 0), 'b', 100);
      const answer = room.order[round]!;
      expect(room.board).toContain(answer);
      const slot = room.board.indexOf(answer);
      const other = room.board[1 - slot];
      room = prepareRound(claimCard(room, 'a', answer, 2200));
      expect(room.board[1 - slot]).toBe(other);
      expect(room.board.length).toBe(2);
    }
    expect(room.phase).toBe('finished');
    expect(room.players[0]!.score).toBe(5);
  });
  it('音源の準備に失敗した曲を見送り、札を除いて次へ進める', () => {
    const room = playing();
    const loading = { ...room, phase: 'loading' as const, startsAt: null };
    const skipped = skipRound(loading, 0);
    expect(skipped.board).toContain(loading.order[0]);
    expect(prepareRound(skipped).board).not.toContain(loading.order[0]);
    expect(skipped.winner).toBeNull();
    expect(prepareRound(skipped).phase).toBe('loading');
    expect(skipRound(room, 0)).toBe(room);
  });
  it('全員の音声準備が完了するまで開始しない', () => {
    const room = emptyRoom('a');
    room.players = ['a', 'b'].map((id) => ({ id, name: id, score: 0, connected: true }));
    const waiting = readyPlayer(
      beginGame(room, ['one', 'two'], 2, () => 0.4),
      'a',
      0,
    );
    expect(waiting.phase).toBe('loading');
    expect(waiting.startsAt).toBeNull();
    const ready = readyPlayer(waiting, 'b', 100);
    expect(ready.phase).toBe('playing');
    expect(ready.startsAt).toBe(100);
  });
  it('準備済みの通知と部外者の通知で状態を更新しない', () => {
    const room = playing();
    const waiting = { ...room, phase: 'loading' as const, startsAt: null, ready: ['a'] };
    expect(readyPlayer(waiting, 'a', 100)).toBe(waiting);
    expect(readyPlayer(waiting, 'absent', 100)).toBe(waiting);
  });
  it('同じ札への競合では最初の有効な取得だけを採用する', () => {
    const room = playing();
    const answer = room.order[0]!;
    const first = claimCard(room, 'a', answer, 2200);
    const second = claimCard(first, 'b', answer, 2201);
    expect(second.winner).toBe('a');
    expect(second.results).toEqual([{ id: answer, owner: 'a' }]);
    expect(second.players.map((player) => player.score)).toEqual([1, 0]);
    expect(second.board).toContain(answer);
    expect(second.board.length).toBe(room.board.length);
    expect(prepareRound(second).board).not.toContain(answer);
  });
  it('開始前・存在しない札・切断した参加者からの取得を無効にする', () => {
    const room = playing();
    expect(claimCard(room, 'a', room.order[0]!, 99)).toBe(room);
    expect(claimCard(room, 'a', 'absent', 2200)).toBe(room);
    room.players[0]!.connected = false;
    expect(claimCard(room, 'a', room.order[0]!, 2200)).toBe(room);
  });
  it('参加中の全員がお手つきしたら正解を発表し、次へ進める', () => {
    const room = playing();
    room.players.push({ id: 'offline', name: 'offline', score: 0, connected: false });
    const wrong = room.board.find((id) => id !== room.order[0])!;
    const first = claimCard(room, 'a', wrong, 200);
    expect(first.phase).toBe('playing');
    const last = claimCard(first, 'b', wrong, 300);
    expect(last.phase).toBe('revealed');
    expect(last.winner).toBeNull();
    expect(last.results).toEqual([{ id: room.order[0], owner: null }]);
    expect(last.players.map((player) => player.score)).toEqual([0, 0, 0]);
    expect(last.board).toEqual(room.board);
    const next = prepareRound(last);
    expect(next.round).toBe(1);
    expect(next.blocked).toEqual([]);
  });
  it('お手つきは減点せず、その曲だけ取得を禁止する', () => {
    const room = playing();
    const wrong = room.board.find((id) => id !== room.order[0])!;
    const missed = claimCard(room, 'a', wrong, 2200);
    expect(missed.players[0]!.score).toBe(0);
    expect(claimCard(missed, 'a', room.order[0]!, 2300)).toBe(missed);
    const won = claimCard(missed, 'b', room.order[0]!, 2400);
    const next = prepareRound(won);
    expect(next.blocked).toEqual([]);
    expect(next.phase).toBe('loading');
    expect(next.round).toBe(1);
  });
});
