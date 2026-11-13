import { describe, expect, it } from 'vite-plus/test';
import {
  finishGame,
  giveUp,
  beginGame,
  finishPreparation,
  claimCard,
  emptyRoom,
  prepareRound,
  readyPlayer,
  skipRound,
} from './room.js';

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
  it('お手つきした札だけを記録し、その場ではほかの札も取得できない', () => {
    const room = playing();
    const wrong = room.board.find((id) => id !== room.order[0])!;
    const missed = claimCard(room, 'a', wrong, 2200);
    expect(missed.blocked).toEqual([]);
    expect(missed.incorrect.a).toEqual([wrong]);
    expect(claimCard(missed, 'a', wrong, 2300)).toBe(missed);
    const both = claimCard(missed, 'b', wrong, 2400);
    expect(both.phase).toBe('playing');
    expect(claimCard(both, 'a', room.order[0]!, 2500)).toBe(both);
    expect(claimCard(missed, 'a', room.order[0]!, 2500)).toBe(missed);
  });
  it('減点せず次の1ターンだけ取得を禁止し、取得またはスキップ後に復帰する', () => {
    for (const skipped of [false, true]) {
      const room = playing();
      const wrong = room.board.find((id) => id !== room.order[0])!;
      const missed = claimCard(room, 'a', wrong, 2200);
      expect(missed.players[0]!.score).toBe(0);
      const next = prepareRound(claimCard(missed, 'b', room.order[0]!, 2400));
      expect(next.blocked).toEqual(['a']);
      expect(next.incorrect).toEqual({});
      const started = readyPlayer(readyPlayer(next, 'a', 3000), 'b', 3000);
      expect(claimCard(started, 'a', started.order[1]!, 4000)).toBe(started);
      const ended = skipped
        ? skipRound(started, 4000)
        : claimCard(started, 'b', started.order[1]!, 4000);
      const restored = prepareRound(ended);
      expect(restored.blocked).toEqual([]);
      const resumed = readyPlayer(readyPlayer(restored, 'a', 5000), 'b', 5000);
      expect(claimCard(resumed, 'a', resumed.order[2]!, 6000).winner).toBe('a');
    }
  });
});

it('準備期限後は準備できた参加者だけで開始し、遅れた参加者も後から合流する', () => {
  const base = emptyRoom('a');
  base.players = ['a', 'b'].map((id) => ({ id, name: id, score: 0, connected: true }));
  const loading = readyPlayer(
    beginGame(base, ['one', 'two'], 2, () => 0.4),
    'a',
    0,
  );
  const started = finishPreparation(loading, 15000);
  expect(started.phase).toBe('playing');
  expect(started.ready).toEqual(['a']);
  const joined = readyPlayer(started, 'b', 18000);
  expect(joined.ready).toEqual(['a', 'b']);
  expect(joined.startsAt).toBe(15000);
});

it('準備期限まで誰も準備できなければ無限に待たず曲を終了する', () => {
  const base = emptyRoom('a');
  base.players = ['a', 'b'].map((id) => ({ id, name: id, score: 0, connected: true }));
  const finished = finishPreparation(
    beginGame(base, ['one', 'two'], 2, () => 0.4),
    15000,
  );
  expect(finished.phase).toBe('revealed');
  expect(finished.results).toHaveLength(1);
});

describe('お手上げ', () => {
  it('参加者の申告を共有し、重複させず次の曲で解除する', () => {
    const room = playing();
    const next = giveUp(room, 'b');
    expect(next.givenUp).toEqual(['b']);
    expect(next.phase).toBe('playing');
    expect(next.players).toEqual(room.players);
    expect(giveUp(next, 'b')).toBe(next);
    expect(prepareRound(skipRound(next, 2200)).givenUp).toEqual([]);
  });
  it('ホスト、閲覧者、未準備、出題終了後の申告を受け付けない', () => {
    const room = playing();
    expect(giveUp(room, 'a')).toBe(room);
    expect(giveUp(room, 'spectator')).toBe(room);
    const waiting = { ...room, ready: ['a'] };
    expect(giveUp(waiting, 'b')).toBe(waiting);
    const revealed = skipRound(room, 2200);
    expect(giveUp(revealed, 'b')).toBe(revealed);
  });
});

it('途中終了では得点と取得結果を保持し、残りの札を未取得として追加しない', () => {
  const room = playing();
  const won = claimCard(room, 'a', room.order[0]!, 2200);
  for (const state of [room, won, prepareRound(won)]) {
    const finished = finishGame(state);
    expect(finished.phase).toBe('finished');
    expect(finished.results).toEqual(state.results);
    expect(finished.players).toEqual(state.players);
    expect(finished.settling).toBe(false);
    expect(finishGame(finished)).toBe(finished);
  }
  const lobby = emptyRoom('a');
  expect(finishGame(lobby)).toBe(lobby);
});
