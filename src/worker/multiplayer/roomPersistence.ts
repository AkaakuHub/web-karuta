import type { RoomContext } from './roomIdentity.js';
import type { Room } from '../../domain/multiplayer/room.js';
import type { Memberships } from '../../domain/multiplayer/membership.js';
import type { ClaimRound } from '../../domain/multiplayer/claims.js';

export async function loadRoomState(storage: RoomContext['storage']) {
  const [room, tokens, kickedTokens, expiresAt, claims] = await Promise.all([
    storage.get<Room>('room'),
    storage.get<Memberships>('tokens'),
    storage.get<Record<string, string[]>>('kickedTokens'),
    storage.get<number>('expiresAt'),
    storage.get<ClaimRound>('claims'),
  ]);
  return {
    room: room ?? null,
    tokens: tokens ?? {},
    kickedTokens: kickedTokens ?? {},
    expiresAt: expiresAt ?? 0,
    claims: claims ?? null,
  };
}
