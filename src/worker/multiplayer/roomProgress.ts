import { finishGame, prepareRound, skipRound, type Room } from '../../domain/multiplayer/room.js';
import type { Command } from '../../domain/multiplayer/protocol.js';

export function progressRoom(room: Room, command: Command, now: number): Room {
  if (command.type === 'finish') return finishGame(room);
  if (command.type === 'next') return prepareRound(room);
  if (command.type === 'skip') return skipRound(room, now);
  return room;
}
