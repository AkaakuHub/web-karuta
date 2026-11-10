import { scoreTotal } from '../game/results.js';
import type { RoomView } from './protocol.js';

export interface Room extends Omit<RoomView, 'total' | 'audio' | 'answer' | 'players'> {
  order: string[];
  players: Omit<RoomView['players'][number], 'removed'>[];
}
export function emptyRoom(host: string): Room {
  return {
    host,
    deckId: null,
    players: [],
    board: [],
    phase: 'lobby',
    round: 0,
    startsAt: null,
    winner: null,
    blocked: [],
    ready: [],
    order: [],
    results: [],
  };
}
export function beginGame(
  room: Room,
  ids: readonly string[],
  capacity: number,
  random: () => number,
): Room {
  if (!['lobby', 'finished'].includes(room.phase)) throw new Error('対戦中です');
  if (room.players.filter((player) => player.connected).length < 2)
    throw new Error('2人以上の参加が必要です');
  const pool = [...new Set(ids)];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  const board = pool.slice(0, capacity);
  if (board.length < 2) throw new Error('出題する音源が不足しています');
  const order = pool;
  for (let i = board.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [board[i], board[j]] = [board[j]!, board[i]!];
  }
  return {
    ...room,
    players: room.players.map((player) => ({ ...player, score: 0 })),
    board,
    order,
    results: [],
    phase: 'loading',
    round: 0,
    startsAt: null,
    blocked: [],
    ready: [],
    winner: null,
  };
}
export function prepareRound(room: Room): Room {
  if (room.phase !== 'revealed') throw new Error('まだ次の曲へ進めません');
  const round = room.round + 1;
  const slot = room.board.indexOf(room.order[room.round]!);
  const incoming = room.order[room.round + room.board.length];
  return {
    ...room,
    round,
    board: room.board.map((id, index) => (index === slot ? (incoming ?? null) : id)),
    phase: round === room.order.length ? 'finished' : 'loading',
    startsAt: null,
    blocked: [],
    ready: [],
    winner: null,
  };
}
export function skipRound(room: Room, now: number): Room {
  if (room.phase !== 'loading' && (room.phase !== 'playing' || now < (room.startsAt ?? Infinity)))
    return room;
  return {
    ...room,
    phase: 'revealed',
    winner: null,
    results: [...room.results, { id: room.order[room.round]!, owner: null }],
  };
}
export function readyPlayer(room: Room, id: string, now: number): Room {
  if (
    room.phase !== 'loading' ||
    !room.players.some((player) => player.id === id && player.connected)
  )
    return room;
  const ready = [...new Set([...room.ready, id])];
  const connected = room.players.filter((player) => player.connected);
  const start = connected.length >= 2 && connected.every((player) => ready.includes(player.id));
  if (!start && room.ready.includes(id)) return room;
  return {
    ...room,
    ready,
    phase: start ? 'playing' : 'loading',
    startsAt: start ? now : null,
  };
}
export function claimCard(room: Room, playerId: string, cardId: string, now: number): Room {
  if (
    room.phase !== 'playing' ||
    room.startsAt === null ||
    now < room.startsAt ||
    room.blocked.includes(playerId) ||
    !room.board.includes(cardId) ||
    !room.players.some((player) => player.id === playerId && player.connected)
  )
    return room;
  const correct = room.order[room.round] === cardId;
  const blocked = correct ? room.blocked : [...room.blocked, playerId];
  const results = correct ? [...room.results, { id: cardId, owner: playerId }] : room.results;
  return revealBlockedRound({
    ...room,
    players: room.players.map((player) =>
      player.id === playerId ? { ...player, score: scoreTotal(results, playerId) } : player,
    ),
    blocked,
    results,
    phase: correct ? 'revealed' : room.phase,
    winner: correct ? playerId : null,
  });
}

export function revealBlockedRound(room: Room): Room {
  const connected = room.players.filter((player) => player.connected);
  return room.phase === 'playing' &&
    connected.length > 0 &&
    connected.every((player) => room.blocked.includes(player.id))
    ? {
        ...room,
        phase: 'revealed',
        winner: null,
        results: [...room.results, { id: room.order[room.round]!, owner: null }],
      }
    : room;
}
