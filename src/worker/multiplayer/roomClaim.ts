import { submitClaim, type ClaimRound } from '../../domain/multiplayer/claims.js';
import type { Room } from '../../domain/multiplayer/room.js';
import type { Command } from '../../domain/multiplayer/protocol.js';
import { attachmentSchema } from './roomIdentity.js';
import { roomClaimWindow, type TimingSocket } from './roomTiming.js';
import { rejectTake } from './roomMessages.js';

export function submitSocketClaim(
  room: Room,
  pending: ClaimRound | null,
  socket: TimingSocket,
  command: Extract<Command, { type: 'take' }>,
  now: number,
  sockets: readonly TimingSocket[],
) {
  const identity = attachmentSchema.parse(socket.deserializeAttachment());
  const result = submitClaim(
    room,
    pending,
    identity.id,
    command.id,
    command.elapsedMs,
    now,
    identity.samples,
    roomClaimWindow(sockets, room.ready),
  );
  if (!result.accepted && result.room === room) {
    if (
      pending?.round === command.round &&
      pending.entries.some((entry) => entry.playerId === identity.id)
    )
      socket.send(JSON.stringify({ type: 'takeAccepted', round: command.round }));
    else rejectTake(socket, command.round);
  }
  return result;
}
