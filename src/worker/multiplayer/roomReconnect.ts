import { disconnectPlayer } from '../../domain/multiplayer/participants.js';
import { startReadyRound, type Room } from '../../domain/multiplayer/room.js';
import type { RoomContent } from './roomIdentity.js';
import { finishUpdate } from './roomProgress.js';

export function closeRoomConnection(room: Room, id: string, now: number, startsAt: number) {
  const competing = room.players.some((person) => person.id === id);
  const updating = !!room.clientUpdate && Object.hasOwn(room.clientUpdate.waiting, id);
  const waiting = competing && ['loading', 'playing', 'revealed'].includes(room.phase);
  const next = disconnectPlayer(
    waiting || updating
      ? { ...room, reconnecting: { ...room.reconnecting, [id]: now + 10000 } }
      : room,
    id,
    startsAt,
  );
  return next.clientUpdate ? { ...next, host: room.host } : next;
}

export function clearReconnect(room: Room, id: string) {
  if (room.reconnecting?.[id] === undefined) return room;
  const reconnecting = { ...room.reconnecting };
  delete reconnecting[id];
  return { ...room, reconnecting };
}

export function expireReconnects(room: Room, now: number, startsAt: number, content: RoomContent) {
  const expired = Object.entries(room.reconnecting ?? {}).filter(([, until]) => until <= now);
  if (!expired.length) return room;
  const next = expired.reduce((current, [id]) => {
    const cleared = clearReconnect(current, id);
    return current.clientUpdate && Object.hasOwn(current.clientUpdate.waiting, id)
      ? finishUpdate(cleared, content, id)
      : cleared;
  }, room);
  return startReadyRound(next, startsAt);
}
