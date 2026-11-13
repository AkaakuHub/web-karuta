import { scoreTotal } from '../game/results.js';
import type { RoomView } from './protocol.js';

export interface Room extends Omit<RoomView, 'total' | 'audio' | 'answer' | 'players'> {
  order: string[];
  settling: boolean;
  players: Omit<RoomView['players'][number], 'removed'>[];
}
export function emptyRoom(host: string): Room {
  return {
    host,
    deckId: null,
    players: [],
    spectators: [],
    board: [],
    phase: 'lobby',
    round: 0,
    startsAt: null,
    winner: null,
    incorrect: {},
    givenUp: [],
    blocked: [],
    ready: [],
    order: [],
    settling: false,
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
    settling: false,
    round: 0,
    startsAt: null,
    incorrect: {},
    givenUp: [],
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
    incorrect: {},
    givenUp: [],
    blocked: Object.keys(room.incorrect),
    ready: [],
    winner: null,
  };
}
export function skipRound(room: Room, now: number): Room {
  if (
    room.settling ||
    (room.phase !== 'loading' && (room.phase !== 'playing' || now < (room.startsAt ?? Infinity)))
  )
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
    !['loading', 'playing'].includes(room.phase) ||
    !room.players.some((player) => player.id === id && player.connected)
  )
    return room;
  const ready = [...new Set([...room.ready, id])];
  if (room.phase === 'playing') return room.ready.includes(id) ? room : { ...room, ready };
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
    (room.incorrect[playerId]?.length ?? 0) > 0 ||
    !room.board.includes(cardId) ||
    !room.players.some((player) => player.id === playerId && player.connected)
  )
    return room;
  const correct = room.order[room.round] === cardId;
  if (correct) return awardCard(room, playerId);
  return {
    ...room,
    incorrect: { ...room.incorrect, [playerId]: [...(room.incorrect[playerId] ?? []), cardId] },
  };
}

export function awardCard(room: Room, owner: string): Room {
  if (room.phase !== 'playing') return room;
  const results = [...room.results, { id: room.order[room.round]!, owner }];
  return {
    ...room,
    settling: false,
    results,
    phase: 'revealed',
    winner: owner,
    players: room.players.map((player) => ({ ...player, score: scoreTotal(results, player.id) })),
  };
}

export function revealBlockedRound(room: Room): Room {
  const connected = room.players.filter((player) => player.connected);
  return !room.settling &&
    room.phase === 'playing' &&
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

export function finishPreparation(room: Room, startsAt: number): Room {
  if (room.phase !== 'loading') return room;
  const ready = room.ready.filter((id) =>
    room.players.some((player) => player.id === id && player.connected),
  );
  return ready.length ? { ...room, ready, phase: 'playing', startsAt } : skipRound(room, startsAt);
}

export function giveUp(room: Room, id: string): Room {
  if (
    room.phase !== 'playing' ||
    room.host === id ||
    room.givenUp.includes(id) ||
    !room.ready.includes(id) ||
    !room.players.some((player) => player.id === id && player.connected)
  )
    return room;
  return { ...room, givenUp: [...room.givenUp, id] };
}
