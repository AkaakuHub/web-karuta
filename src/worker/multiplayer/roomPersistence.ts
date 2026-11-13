import { migrateRoom, type StoredRoom } from './migrations/room.js';
import type { RoomContext } from './roomIdentity.js';
import type { Room } from '../../domain/multiplayer/room.js';
import type { Memberships } from '../../domain/multiplayer/membership.js';
import type { ClaimRound } from '../../domain/multiplayer/claims.js';

export async function loadRoomState(storage: RoomContext['storage']) {
  const [room, tokens, kickedTokens, expiresAt, claims, loadingDeadline] = await Promise.all([
    storage.get<StoredRoom>('room'),
    storage.get<Memberships>('tokens'),
    storage.get<Record<string, string[]>>('kickedTokens'),
    storage.get<number>('expiresAt'),
    storage.get<ClaimRound>('claims'),
    storage.get<number>('loadingDeadline'),
  ]);
  const restored = room ? migrateRoom(room) : null;
  if (room && (room.givenUp === undefined || room.incorrect === undefined))
    await storage.put({ room: restored });
  return {
    room: restored,
    tokens: tokens ?? {},
    kickedTokens: kickedTokens ?? {},
    expiresAt: expiresAt ?? 0,
    claims: claims ?? null,
    loadingDeadline: loadingDeadline ?? 0,
  };
}

export async function saveRoomState(
  storage: RoomContext['storage'],
  state: {
    room: Room | null;
    claims: ClaimRound | null;
    expiresAt: number;
    loadingDeadline: number;
    tokens?: Memberships;
    kickedTokens?: Record<string, string[]>;
  },
) {
  await storage.put(state);
  await storage.setAlarm(
    Math.min(
      state.expiresAt,
      state.claims?.deadline ?? state.expiresAt,
      state.loadingDeadline || state.expiresAt,
    ),
  );
}
