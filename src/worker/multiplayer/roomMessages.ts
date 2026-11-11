declare const WebSocketPair: typeof import('@cloudflare/workers-types').WebSocketPair;
import type { WebSocket as RoomSocket } from '@cloudflare/workers-types';
import type { Memberships } from '../../domain/multiplayer/membership.js';
import type { Room } from '../../domain/multiplayer/room.js';
import { roomPatch } from '../../domain/multiplayer/transport.js';
import type { RoomView } from '../../domain/multiplayer/protocol.js';
import { commandSchema } from '../../domain/multiplayer/protocol.js';
import { attachmentSchema, unsupportedRoom } from './roomIdentity.js';

export function readRoomMessage(
  socket: RoomSocket,
  message: string | ArrayBuffer,
  room: Room | null,
  tokens: Memberships,
) {
  if (room && !Object.hasOwn(room, 'settling')) {
    socket.close(1008, unsupportedRoom);
    return null;
  }
  if (!room || typeof message !== 'string' || message.length > 1024) {
    socket.close(1008, '不正な通信です');
    return null;
  }
  const identity = attachmentSchema.parse(socket.deserializeAttachment());
  if (
    !Object.values(tokens).some(
      (person) => person?.id === identity.id && person.connectionId === identity.connectionId,
    )
  ) {
    socket.close(4003, '参加情報が無効です');
    return null;
  }
  let input: unknown;
  try {
    input = JSON.parse(message);
  } catch {
    return null;
  }
  const parsed = commandSchema.safeParse(input);
  return parsed.success ? { command: parsed.data, identity } : null;
}

export function broadcastRoom(
  sockets: readonly RoomSocket[],
  view: RoomView,
  previous?: RoomView,
  initialSocket?: RoomSocket,
) {
  const update = previous
    ? JSON.stringify({ type: 'update', room: roomPatch(previous, view) })
    : null;
  for (const socket of sockets) {
    const { id } = attachmentSchema.parse(socket.deserializeAttachment());
    if (socket.readyState === 1)
      socket.send(
        (socket === initialSocket ? null : update) ??
          JSON.stringify({ type: 'state', you: id, room: view }),
      );
  }
}

export function rejectJoin(message: string) {
  const pair = new WebSocketPair();
  pair[1].accept();
  pair[1].send(JSON.stringify({ type: 'error', message }));
  pair[1].close(1008, '参加できません');
  const init: ResponseInit & { webSocket: RoomSocket } = { status: 101, webSocket: pair[0] };
  return new Response(null, init);
}
