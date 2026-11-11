import type { RoomView } from '../../domain/multiplayer/protocol.js';
import type { PlayerSeries } from '../../domain/game/seriesBreakdown.js';

export const helpRoom: RoomView = {
  host: 'you',
  deckId: null,
  players: [
    { id: 'you', name: 'あなた', score: 1, connected: true, removed: false },
    { id: 'other', name: 'あかり', score: 0, connected: true, removed: false },
  ],
  spectators: [],
  board: [],
  phase: 'playing',
  round: 0,
  total: 10,
  startsAt: null,
  audio: null,
  answer: null,
  winner: null,
  blocked: [],
  ready: [],
  results: [{ id: 'sample', owner: 'you' }],
};

export const helpSeries: PlayerSeries = {
  id: 'you',
  name: 'あなた',
  total: 10,
  slices: [
    { id: 'first', name: 'シリーズA', color: '#168fe5', count: 6, value: 6 },
    { id: 'second', name: 'シリーズB', color: '#ed70aa', count: 4, value: 4 },
  ],
};
