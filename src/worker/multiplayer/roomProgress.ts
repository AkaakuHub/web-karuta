import { boardCapacity } from '../../domain/game/boardLayout.js';
import {
  beginGame,
  finishGame,
  prepareRound,
  skipRound,
  type Room,
} from '../../domain/multiplayer/room.js';
import type { Command } from '../../domain/multiplayer/protocol.js';
import type { Membership, Memberships } from '../../domain/multiplayer/membership.js';
import { joinParticipant } from '../../domain/multiplayer/participants.js';
import type { RoomContent } from './roomIdentity.js';

function advance(
  room: Room,
  command: Extract<Command, { type: 'start' | 'next' }>,
  content: RoomContent,
) {
  if (command.type === 'next') return prepareRound(room);
  return {
    ...beginGame(room, content.deckIds(command.deckId), boardCapacity, Math.random),
    deckId: command.deckId,
  };
}

export function progressRoom(
  room: Room,
  command: Command,
  now: number,
  content: RoomContent,
  tokens: Memberships,
): Room {
  if (command.type === 'start' || command.type === 'next') {
    if (room.clientUpdate) return room;
    const next = advance(room, command, content);
    if (!content.clientVersion) return next;
    const connected = new Set(
      [...room.players, ...room.spectators]
        .filter(({ connected }) => connected)
        .map(({ id }) => id),
    );
    const required = Object.values(tokens).filter(
      (member): member is Membership => !!member && connected.has(member.id),
    );
    if (required.every(({ version }) => version === content.clientVersion)) return next;
    return {
      ...room,
      clientUpdate: {
        version: content.clientVersion,
        waiting: Object.fromEntries(required.map(({ id, connectionId }) => [id, connectionId])),
        command,
      },
    };
  }
  if (room.clientUpdate) return room;
  if (command.type === 'finish') return finishGame(room);
  if (command.type === 'skip') return skipRound(room, now);
  return room;
}

export function joinRoom(
  room: Room,
  member: Membership,
  name: string,
  tokens: Memberships,
  content: RoomContent,
) {
  const joined = joinParticipant(room, member.id, name, member.spectator);
  const update = room.clientUpdate;
  if (!update) return joined;
  const waiting = { ...update.waiting };
  const version = content.clientVersion ?? update.version;
  if (version !== update.version) {
    const connected = new Set(
      [...room.players, ...room.spectators]
        .filter(({ connected }) => connected)
        .map(({ id }) => id),
    );
    for (const entry of Object.values(tokens)) {
      if (entry && entry.id !== member.id && connected.has(entry.id))
        waiting[entry.id] = entry.connectionId;
    }
  }
  if (member.version === version && waiting[member.id] !== member.connectionId)
    delete waiting[member.id];
  else if (!Object.hasOwn(waiting, member.id)) waiting[member.id] = member.connectionId;
  return finishUpdate(
    { ...joined, host: room.host, clientUpdate: { ...update, version, waiting } },
    content,
  );
}

export function finishUpdate(room: Room, content: RoomContent, departed?: string): Room {
  const update = room.clientUpdate;
  if (!update) return room;
  const waiting = { ...update.waiting };
  if (departed) delete waiting[departed];
  if (Object.keys(waiting).length) return { ...room, clientUpdate: { ...update, waiting } };
  const ready = { ...room, clientUpdate: undefined };
  if (
    update.command.type === 'start' &&
    ready.players.filter((player) => player.connected).length < 2
  )
    return ready;
  const next = advance(ready, update.command, content);
  return { ...next, waitForUpdateAudio: next.phase === 'loading' };
}
