import type { WebSocket as RoomSocket } from '@cloudflare/workers-types';
import { attachmentSchema } from './roomIdentity.js';
import { claimAllowance } from '../../domain/multiplayer/claimTiming.js';

export function probeSocket(socket: RoomSocket, now: number) {
  const identity = attachmentSchema.parse(socket.deserializeAttachment());
  if (now - identity.lastProbe < 90 || (identity.probe && now - identity.probe.sent < 3000)) return;
  const probe = { id: crypto.randomUUID(), sent: now };
  socket.serializeAttachment({ ...identity, probe, lastProbe: now });
  socket.send(JSON.stringify({ type: 'probe', id: probe.id }));
}

export function acknowledgeProbe(socket: RoomSocket, id: string, now: number) {
  const identity = attachmentSchema.parse(socket.deserializeAttachment());
  if (identity.probe?.id !== id) return;
  const elapsed = now - identity.probe.sent;
  if (elapsed < 0 || elapsed > 10000) return;
  const samples = [...identity.samples, elapsed].slice(-8);
  socket.serializeAttachment({ ...identity, probe: null, samples });
  if (samples.length >= 2) socket.send(JSON.stringify({ type: 'timingReady' }));
}

export function roundStartTime(now: number, sockets: readonly RoomSocket[]): number {
  const roundTrips = sockets
    .filter((socket) => socket.readyState === 1)
    .map((socket) => attachmentSchema.parse(socket.deserializeAttachment()))
    .filter((identity) => !identity.spectator)
    .flatMap((identity) => identity.samples);
  return now + 500 + Math.max(0, ...roundTrips);
}

export function roomClaimWindow(sockets: readonly RoomSocket[], ready: readonly string[]): number {
  const allowances = sockets
    .filter((socket) => socket.readyState === 1)
    .map((socket) => attachmentSchema.parse(socket.deserializeAttachment()))
    .filter(
      (identity) =>
        !identity.spectator && ready.includes(identity.id) && identity.samples.length >= 2,
    )
    .map((identity) => claimAllowance(identity.samples));
  return Math.max(150, ...allowances);
}
