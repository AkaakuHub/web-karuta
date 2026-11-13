import { describe, expect, it } from 'vite-plus/test';
import { endMembership, type Memberships } from './membership.js';
import {
  canCommand,
  disconnectPlayer,
  joinParticipant,
  leaveParticipant,
  renameParticipant,
} from './participants.js';
import { beginGame, claimCard, emptyRoom, readyPlayer } from './room.js';

function populated() {
  return joinParticipant(
    joinParticipant(joinParticipant(emptyRoom(''), 'watch', '閲覧者', true), 'a', 'あかり', false),
    'b',
    'さくら',
    false,
  );
}

describe('閲覧専用の参加', () => {
  it('先に入室してもホストやプレイヤーにならない', () => {
    const room = joinParticipant(emptyRoom(''), 'watch', '閲覧者', true);
    expect(room.host).toBe('');
    expect(room.players).toEqual([]);
    expect(room.spectators.map((person) => person.id)).toEqual(['watch']);
    expect(populated().host).toBe('a');
  });
  it('閲覧者は開始人数を満たさず、プレイヤー2人なら準備を待たずに開始する', () => {
    const one = joinParticipant(
      joinParticipant(emptyRoom(''), 'watch', '閲覧者', true),
      'a',
      'あかり',
      false,
    );
    expect(() => beginGame(one, ['one', 'two'], 2, () => 0.5)).toThrow();
    const loading = beginGame(populated(), ['one', 'two'], 2, () => 0.5);
    expect(readyPlayer(loading, 'watch', 100)).toBe(loading);
    const playing = readyPlayer(readyPlayer(loading, 'a', 100), 'b', 200);
    expect(playing.phase).toBe('playing');
    expect(playing.ready).toEqual(['a', 'b']);
    expect(claimCard(playing, 'watch', playing.order[0]!, 300)).toBe(playing);
  });
  it('閲覧者の偽装操作を拒否し同期と退室だけ許す', () => {
    const room = populated();
    for (const type of ['take', 'ready', 'start', 'next', 'skip', 'finish', 'kick', 'unkick']) {
      expect(canCommand(room, 'watch', type)).toBe(false);
    }
    for (const type of ['ping', 'sync', 'leave'])
      expect(canCommand(room, 'watch', type)).toBe(true);
    expect(canCommand(room, 'b', 'finish')).toBe(false);
    expect(canCommand(room, 'a', 'finish')).toBe(true);
    expect(canCommand(room, 'b', 'kick')).toBe(false);
    expect(canCommand(room, 'a', 'kick')).toBe(true);
  });
  it('ホストが退出しても閲覧者へ権限を渡さない', () => {
    const next = leaveParticipant(leaveParticipant(populated(), 'a', 100), 'b', 200);
    expect(next.host).toBe('');
    expect(next.players).toEqual([]);
    expect(next.spectators).toHaveLength(1);
  });
  it('通信切断は参加情報を保持し同じ閲覧者として復帰する', () => {
    const disconnected = disconnectPlayer(populated(), 'watch', 100);
    expect(disconnected.spectators[0]?.connected).toBe(false);
    const restored = joinParticipant(disconnected, 'watch', '閲覧者', true);
    expect(restored.spectators).toHaveLength(1);
    expect(restored.spectators[0]?.connected).toBe(true);
    expect(restored.players).toHaveLength(2);
    expect(() => joinParticipant(restored, 'watch', '閲覧者', false)).toThrow();
  });
  it('明示的な退室では履歴の所有者だけを残し閲覧者を除く', () => {
    const room = populated();
    room.results = [{ id: 'one', owner: 'a' }];
    const next = leaveParticipant(leaveParticipant(room, 'a', 100), 'watch', 200);
    expect(next.results).toEqual(room.results);
    expect(next.players.find((person) => person.id === 'a')?.connected).toBe(false);
    expect(next.spectators).toEqual([]);
  });
});

describe('退室通知の接続識別', () => {
  const members: Memberships = { token: { id: 'a', connectionId: 'current', spectator: false } };
  it('古いページや無関係な接続からの遅延通知で現在の接続を退出させない', () => {
    expect(endMembership(members, 'token', 'old')).toBe(members);
    expect(endMembership(members, 'missing', 'current')).toBe(members);
    const ended = endMembership(members, 'token', 'current');
    expect(ended.token).toEqual({ id: 'a', spectator: false, connectionId: '' });
    expect(endMembership(ended, 'token', 'current')).toBe(ended);
    expect(members.token?.id).toBe('a');
  });
});

it('プレイ中に自分の名前だけを変え、役割・得点・進行を保つ', () => {
  const room = populated();
  room.phase = 'playing';
  room.players[0]!.score = 3;
  const next = renameParticipant(room, 'a', '新しい名前');
  expect(next.players).toEqual([{ ...room.players[0]!, name: '新しい名前' }, room.players[1]]);
  expect(next.host).toBe(room.host);
  expect(next.phase).toBe(room.phase);
  const viewer = renameParticipant(next, 'watch', '閲覧名');
  expect(viewer.spectators).toEqual([{ ...room.spectators[0]!, name: '閲覧名' }]);
  expect(viewer.players).toEqual(next.players);
  expect(canCommand(room, 'watch', 'rename')).toBe(true);
});

it('退出後も同じ参加者IDと得点で再入室する', () => {
  const room = populated();
  room.results = [{ id: 'card', owner: 'a' }];
  room.players[0]!.score = 1;
  const members: Memberships = { token: { id: 'a', spectator: false, connectionId: 'old' } };
  const ended = endMembership(members, 'token', 'old');
  const member = ended.token!;
  const next = joinParticipant(
    leaveParticipant(room, member.id, 100),
    member.id,
    'あかり',
    member.spectator,
  );
  expect(next.players.filter((player) => player.id === 'a')).toEqual([room.players[0]]);
  expect(next.results).toEqual(room.results);
});
