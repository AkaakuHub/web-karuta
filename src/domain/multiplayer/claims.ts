import { awardCard, claimCard, type Room } from './room.js';
import { claimAllowance, validClaimTime, winningClaim, type TimedClaim } from './claimTiming.js';

export interface ClaimRound {
  round: number;
  deadline: number;
  entries: TimedClaim[];
}

export function submitClaim(
  room: Room,
  pending: ClaimRound | null,
  playerId: string,
  cardId: string,
  elapsedMs: number,
  receivedAt: number,
  rtts: readonly number[],
  windowMs: number,
) {
  if (
    room.phase !== 'playing' ||
    room.startsAt === null ||
    !room.ready.includes(playerId) ||
    room.blocked.includes(playerId) ||
    !room.board.includes(cardId) ||
    pending?.entries.some((claim) => claim.playerId === playerId)
  )
    return { room, pending, accepted: false };
  if (!validClaimTime(elapsedMs, room.startsAt, receivedAt, claimAllowance(rtts)))
    throw new Error('通信または音声の時刻が一致しません。次の曲で再同期します');
  if (cardId !== room.order[room.round])
    return { room: claimCard(room, playerId, cardId, receivedAt), pending, accepted: false };
  const next = pending ?? { round: room.round, deadline: receivedAt + windowMs, entries: [] };
  return {
    room: { ...room, settling: true },
    pending: { ...next, entries: [...next.entries, { playerId, elapsedMs }] },
    accepted: true,
  };
}

export function settleClaims(room: Room, pending: ClaimRound, random: () => number): Room {
  if (pending.round !== room.round) return { ...room, settling: false };
  const eligible = pending.entries.filter((claim) =>
    room.players.some((player) => player.id === claim.playerId),
  );
  const winner = winningClaim(eligible, random);
  return winner ? awardCard(room, winner) : { ...room, settling: false };
}
