import type { WebSocket as RoomSocket } from '@cloudflare/workers-types';
import type { Memberships } from '../../domain/multiplayer/membership.js';
import type { Room } from '../../domain/multiplayer/room.js';
import { kickPlayer } from '../../domain/multiplayer/participants.js';
import type { Command } from '../../domain/multiplayer/protocol.js';

export function moderateRoom(
  room: Room,
  command: Extract<Command, { type: 'kick' | 'unkick' }>,
  actor: string,
  tokens: Memberships,
  kickedTokens: Record<string, string[]>,
  sockets: readonly RoomSocket[],
  now: number,
): Room {
  if (command.type === 'kick') {
    if (!Object.values(tokens).some((person) => person?.id === command.playerId))
      throw new Error('この参加者は退出済みです');
    const next = kickPlayer(room, actor, command.playerId, now);
    for (const [token, player] of Object.entries(tokens)) {
      if (player?.id === command.playerId) {
        kickedTokens[player.id] = [...(kickedTokens[player.id] ?? []), token];
        tokens[token] = null;
      }
    }
    for (const socket of sockets) socket.close(4003, 'ホストによって退出しました');
    return next;
  }
  if (actor !== room.host) throw new Error('ホストが操作します');
  const banned = kickedTokens[command.playerId];
  if (!banned?.length) throw new Error('この参加者のキックは解除できません');
  for (const token of banned)
    tokens[token] = { id: command.playerId, spectator: false, connectionId: crypto.randomUUID() };
  delete kickedTokens[command.playerId];
  return { ...room };
}
