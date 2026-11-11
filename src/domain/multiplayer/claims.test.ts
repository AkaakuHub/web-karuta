import { expect, it } from 'vite-plus/test';
import { submitClaim, settleClaims } from './claims.js';
import { beginGame, emptyRoom, readyPlayer, skipRound } from './room.js';
import { disconnectPlayer } from './participants.js';

function playing() {
  const room = emptyRoom('a');
  room.players = ['a', 'b', 'c'].map((id) => ({ id, name: id, score: 0, connected: true }));
  return readyPlayer(
    readyPlayer(
      readyPlayer(
        beginGame(room, ['one', 'two'], 2, () => 0.5),
        'a',
        1000,
      ),
      'b',
      1000,
    ),
    'c',
    1000,
  );
}

it('届いた時点では正解を公開せず、遅い回線から早い反応の入力が届くまで比較する', () => {
  const room = playing();
  const first = submitClaim(room, null, 'a', room.order[0]!, 600, 1620, [40, 40], 350);
  expect(first.room.phase).toBe('playing');
  expect(first.room.results).toEqual([]);
  expect(first.pending?.deadline).toBe(1970);
  const second = submitClaim(
    first.room,
    first.pending,
    'b',
    room.order[0]!,
    500,
    1800,
    [400, 400],
    350,
  );
  const settled = settleClaims(second.room, second.pending!, () => 0);
  expect(settled.winner).toBe('b');
  expect(settled.players.map((player) => player.score)).toEqual([0, 1, 0]);
});

it('時刻が完全に同じ場合も1人だけへ1点を与え、札を重複して記録しない', () => {
  const room = playing();
  const first = submitClaim(room, null, 'a', room.order[0]!, 500, 1520, [40, 40], 350);
  const second = submitClaim(
    first.room,
    first.pending,
    'b',
    room.order[0]!,
    500,
    1800,
    [400, 400],
    350,
  );
  const settled = settleClaims(second.room, second.pending!, () => 0.99);
  expect(settled.winner).toBe('b');
  expect(settled.results).toEqual([{ id: room.order[0], owner: 'b' }]);
  expect(settled.players.map((player) => player.score)).toEqual([0, 1, 0]);
});

it('判定中の見送りや残りの人のお手つきで正解の入力を失わない', () => {
  const room = playing();
  const first = submitClaim(room, null, 'a', room.order[0]!, 500, 1520, [40, 40], 350);
  expect(skipRound(first.room, 1600)).toBe(first.room);
  const disconnected = disconnectPlayer(first.room, 'a', 1600);
  const wrong = room.board.find((id) => id !== room.order[0])!;
  const second = submitClaim(disconnected, first.pending, 'b', wrong, 600, 1620, [40, 40], 350);
  const third = submitClaim(second.room, second.pending, 'c', wrong, 650, 1670, [40, 40], 350);
  expect(third.room.phase).toBe('playing');
  expect(settleClaims(third.room, third.pending!, () => 0).winner).toBe('a');
});

it('準備していない途中参加者と同じ人の重複入力を採用しない', () => {
  const room = playing();
  room.players.push({ id: 'late', name: 'late', score: 0, connected: true });
  expect(submitClaim(room, null, 'late', room.order[0]!, 500, 1520, [40, 40], 350).room).toBe(room);
  const first = submitClaim(room, null, 'a', room.order[0]!, 500, 1520, [40, 40], 350);
  expect(
    submitClaim(first.room, first.pending, 'a', room.order[0]!, 400, 1530, [40, 40], 350).pending
      ?.entries,
  ).toHaveLength(1);
  const wrongRound = { ...first.pending!, round: 10 };
  expect(settleClaims(first.room, wrongRound, () => 0).results).toEqual([]);
});
