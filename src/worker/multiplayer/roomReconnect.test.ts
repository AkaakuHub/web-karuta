import { expect, it } from 'vite-plus/test';
import { joinParticipant } from '../../domain/multiplayer/participants.js';
import { beginGame, emptyRoom, readyPlayer } from '../../domain/multiplayer/room.js';
import { clearReconnect, closeRoomConnection, expireReconnects } from './roomReconnect.js';

const content = { deckIds: () => ['one', 'two'], audioFor: () => '' };

function loading() {
  const joined = ['a', 'b', 'c'].reduce(
    (room, id) => joinParticipant(room, id, id, false),
    emptyRoom(''),
  );
  return beginGame(joined, content.deckIds(), 2, () => 0.5);
}

it('切断から10秒間は開始せず、復帰しなければ準備済みの参加者だけを同時に開始する', () => {
  const disconnected = closeRoomConnection(loading(), 'c', 1000, 1500);
  const ready = readyPlayer(readyPlayer(disconnected, 'a', 2000), 'b', 2000);
  expect(ready.phase).toBe('loading');
  expect(expireReconnects(ready, 10999, 11499, content)).toBe(ready);
  const started = expireReconnects(ready, 11000, 11500, content);
  expect(started.phase).toBe('playing');
  expect(started.startsAt).toBe(11500);
  expect(started.ready).toEqual(['a', 'b']);
  expect(started.results).toEqual([]);
});

it('復帰した参加者の音声準備が終わるまで待ち、接続中の準備に期限を設けない', () => {
  const disconnected = closeRoomConnection(loading(), 'c', 1000, 1500);
  const rejoined = joinParticipant(clearReconnect(disconnected, 'c'), 'c', 'c', false);
  const ready = readyPlayer(readyPlayer(rejoined, 'a', 2000), 'b', 2000);
  expect(expireReconnects(ready, 61000, 61500, content)).toBe(ready);
  expect(readyPlayer(ready, 'c', 62500)).toMatchObject({ phase: 'playing', startsAt: 62500 });
});
