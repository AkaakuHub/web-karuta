import type { Room } from '../../domain/multiplayer/room.js';
import type { Memberships } from '../../domain/multiplayer/membership.js';
import type { RoomContent } from './roomIdentity.js';

export function publicRoom(value: Room, tokens: Memberships, content: RoomContent) {
  const { order, settling, clientUpdate, waitForUpdateAudio: _, ...room } = value;
  if (settling && room.phase !== 'playing') throw new Error('判定中の進行が一致しません');
  const answer = order[room.round] ?? null;
  const active = new Set(Object.values(tokens).map((person) => person?.id));
  return {
    ...room,
    players: room.players.map((player) => ({
      ...player,
      removed: !active.has(player.id),
    })),
    total: order.length,
    clientUpdate: clientUpdate
      ? { version: clientUpdate.version, waiting: Object.keys(clientUpdate.waiting) }
      : null,
    answer: room.phase === 'revealed' ? answer : null,
    audio:
      ['loading', 'playing', 'revealed'].includes(room.phase) && answer
        ? content.audioFor(answer, room.round)
        : null,
  };
}
