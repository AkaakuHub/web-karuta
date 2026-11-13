import type { Room } from '../../../domain/multiplayer/room.js';

export type StoredRoom = Omit<Room, 'givenUp' | 'incorrect'> & {
  givenUp?: string[];
  incorrect?: Record<string, string[]>;
};

export function migrateRoom(room: StoredRoom): Room {
  const { givenUp, incorrect, ...state } = room;
  return {
    ...state,
    givenUp: givenUp === undefined ? [] : givenUp,
    incorrect: incorrect === undefined ? {} : incorrect,
  };
}
