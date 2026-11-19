import { expect, it } from 'vite-plus/test';
import { emptyRoom, beginGame, skipRound, readyPlayer } from '../../domain/multiplayer/room.js';
import { joinParticipant } from '../../domain/multiplayer/participants.js';
import type { Memberships } from '../../domain/multiplayer/membership.js';
import { joinRoom, progressRoom } from './roomProgress.js';

it('新旧どちらの参加者も再接続するまで曲を進めず、音声準備も待つ', () => {
  const content = { clientVersion: 'new', deckIds: () => ['a', 'b'], audioFor: () => '' };
  const tokens: Memberships = {
    first: { id: 'first', connectionId: 'first-old', spectator: false, version: 'old' },
    second: { id: 'second', connectionId: 'second-before', spectator: false, version: 'new' },
  };
  let room = joinParticipant(emptyRoom(''), 'first', '1人目', false);
  room = joinParticipant(room, 'second', '2人目', false);
  room = skipRound(
    beginGame(room, content.deckIds(), 21, () => 0),
    0,
  );
  const command = { type: 'next', round: 0 } as const;
  room = progressRoom(room, command, 0, content, tokens);
  expect(Object.keys(room.clientUpdate!.waiting)).toEqual(['first', 'second']);
  expect(room.round).toBe(0);
  expect(progressRoom(room, command, 0, content, tokens)).toBe(room);
  room = joinRoom(room, tokens.second!, '2人目', tokens, content);
  expect(room.clientUpdate?.waiting.second).toBe('second-before');
  tokens.second = { ...tokens.second!, connectionId: 'second-after' };
  room = joinRoom(room, tokens.second, '2人目', tokens, content);
  expect(room.phase).toBe('revealed');
  expect(Object.keys(room.clientUpdate!.waiting)).toEqual(['first']);
  tokens.first = { ...tokens.first!, connectionId: 'first-new', version: 'new' };
  room = joinRoom(room, tokens.first, '1人目', tokens, content);
  expect(room.clientUpdate).toBeUndefined();
  expect(room.host).toBe('first');
  expect(room.phase).toBe('loading');
  expect(room.round).toBe(1);
  room = readyPlayer(room, 'first', 60_000);
  expect(room.phase).toBe('loading');
  expect(readyPlayer(room, 'second', 90_000).phase).toBe('playing');
});
