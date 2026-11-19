import type { Room } from '../../../domain/multiplayer/room.js';

export type StoredRoom = Omit<Room, 'givenUp' | 'incorrect' | 'players'> & {
  players: (Room['players'][number] & { score?: number })[];
  givenUp?: string[];
  incorrect?: Record<string, string[]>;
};

export function migrateRoom(room: StoredRoom): Room {
  return {
    ...room,
    players: room.players.map(({ id, name, connected }) => ({ id, name, connected })),
    givenUp: room.givenUp === undefined ? [] : room.givenUp,
    incorrect: room.incorrect === undefined ? {} : room.incorrect,
  };
}
