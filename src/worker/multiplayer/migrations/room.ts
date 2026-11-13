import type { Room } from '../../../domain/multiplayer/room.js';

export type StoredRoom = Omit<Room, 'givenUp' | 'incorrect'> & {
  givenUp?: string[];
  incorrect?: Record<string, string[]>;
};

export function migrateRoom(room: StoredRoom): Room {
  return {
    ...room,
    givenUp: room.givenUp === undefined ? [] : room.givenUp,
    incorrect: room.incorrect === undefined ? {} : room.incorrect,
  };
}
