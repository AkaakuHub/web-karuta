import type { RoomView } from './protocol.js';
import type { GameFeedback } from '../game/session.js';

export function roomFeedback(
  previous: RoomView | null,
  next: RoomView,
  you: string,
): GameFeedback['kind'] | null {
  if (!previous) return null;
  if (next.phase === 'finished' && previous.phase !== 'finished') return 'complete';
  if (next.round !== previous.round || next.phase === 'loading') return null;
  if (next.blocked.includes(you) && !previous.blocked.includes(you)) return 'incorrect';
  if (next.phase === 'revealed' && previous.phase !== 'revealed')
    return next.winner ? 'correct' : 'skipped';
  return null;
}

export function roomClaimant(
  room: RoomView,
  you: string,
): Pick<GameFeedback, 'winner' | 'opponent'> {
  return {
    winner: room.players.find((player) => player.id === room.winner)?.name,
    opponent: room.winner !== null && room.winner !== you,
  };
}
