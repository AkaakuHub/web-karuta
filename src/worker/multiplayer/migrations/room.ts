import type { Room } from '../../../domain/multiplayer/room.js';

export type StoredRoom = Omit<Room, 'givenUp'> & { givenUp?: string[] };

export function migrateRoom(room: StoredRoom): Room {
  const { givenUp, ...state } = room;
  return { ...state, givenUp: givenUp === undefined ? [] : givenUp };
}
