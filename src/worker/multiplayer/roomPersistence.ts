import { preparationDeadline } from '../../domain/multiplayer/preparation.js';
import { migrateRoom, type StoredRoom } from './migrations/room.js';
import type { Room } from '../../domain/multiplayer/room.js';
import type { Memberships } from '../../domain/multiplayer/membership.js';
import type { ClaimRound } from '../../domain/multiplayer/claims.js';

export const roomLifetime = 24 * 60 * 60 * 1000;

interface RoomSavedState {
  room: Room | null;
  claims: ClaimRound | null;
  expiresAt: number;
  loadingDeadline: number;
  tokens?: Memberships;
  kickedTokens?: Record<string, string[]>;
}
export interface RoomStorage {
  get<T>(key: string): Promise<T | undefined>;
  put(values: Record<string, unknown>): Promise<void>;
  getAlarm(): Promise<number | null>;
  setAlarm(time: number): Promise<void>;
  deleteAll(): Promise<void>;
}
export class RoomPersistence {
  private previous = new Map<string, string>();
  private alarm: number | null = null;
  constructor(private readonly storage: RoomStorage) {}
  async load() {
    const storage = this.storage;
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
    const state = {
      room: restored,
      tokens: tokens ?? {},
      kickedTokens: kickedTokens ?? {},
      expiresAt: expiresAt ?? 0,
      claims: claims ?? null,
      loadingDeadline: loadingDeadline ?? 0,
    };
    for (const [key, value] of Object.entries(state)) this.previous.set(key, JSON.stringify(value));
    this.alarm = await storage.getAlarm();
    const normalized = {
      ...state,
      loadingDeadline: preparationDeadline(state.room, state.loadingDeadline, Date.now()),
    };
    if (
      state.room &&
      state.expiresAt > Date.now() &&
      normalized.loadingDeadline !== state.loadingDeadline
    )
      await this.save(normalized);
    return normalized;
  }

  async save(state: RoomSavedState) {
    const changed = Object.entries(state).filter(
      ([key, value]) => this.previous.get(key) !== JSON.stringify(value),
    );
    if (changed.length) {
      await this.storage.put(Object.fromEntries(changed));
      for (const [key, value] of changed) this.previous.set(key, JSON.stringify(value));
    }
    const alarm = Math.min(
      state.expiresAt,
      state.claims?.deadline ?? state.expiresAt,
      state.loadingDeadline || state.expiresAt,
    );
    if (alarm !== this.alarm) {
      await this.storage.setAlarm(alarm);
      this.alarm = alarm;
    }
  }
  alarmFired() {
    this.alarm = null;
  }
  async clear() {
    await this.storage.deleteAll();
    this.previous.clear();
    this.alarm = null;
  }
}
