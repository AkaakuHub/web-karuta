import type { Room } from '../../domain/multiplayer/room.js';
import type { Memberships } from '../../domain/multiplayer/membership.js';
import type { RoomContent } from './roomIdentity.js';

export function publicRoom(value: Room, tokens: Memberships, content: RoomContent) {
  const { order, ...room } = value;
  const answer = order[room.round] ?? null;
  const active = new Set(Object.values(tokens).map((person) => person?.id));
  return {
    ...room,
    players: room.players.map((player) => ({
      ...player,
      removed: !active.has(player.id),
    })),
    total: order.length,
    answer: room.phase === 'revealed' ? answer : null,
    audio:
      ['loading', 'playing', 'revealed'].includes(room.phase) && answer
        ? content.audioFor(answer, room.round)
        : null,
  };
}
