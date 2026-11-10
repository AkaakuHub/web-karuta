import { checkpointSchema, type GameCheckpoint } from '../../domain/game/checkpoint.js';
import type { GameSession } from '../../domain/game/session.js';
import type { PracticeMode } from '../../domain/practice/model.js';

type CheckpointStorage = Pick<Storage, 'length' | 'key' | 'getItem' | 'setItem' | 'removeItem'>;

export class GameCheckpointStore {
  private records: Record<string, GameCheckpoint> = {};
  private current: GameCheckpoint | null = null;
  private raw: string | null;
  private archives = new Set<string>();
  private errors = new Map<string, string>();
  private readonly archivePrefix: string;
  constructor(
    private readonly storage: CheckpointStorage,
    private readonly currentKey: string,
  ) {
    this.archivePrefix = `${this.currentKey}:`;
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (!key?.startsWith(this.archivePrefix)) continue;
      const deckId = key.slice(this.archivePrefix.length);
      this.archives.add(deckId);
      this.read(key, storage.getItem(key), deckId);
    }
    this.raw = storage.getItem(this.currentKey);
    this.current = this.read(this.currentKey, this.raw);
  }
  private read(key: string, raw: string | null, deckId?: string) {
    if (raw === null) return null;
    try {
      const saved = checkpointSchema.parse(JSON.parse(raw));
      if (deckId !== undefined && saved.deckId !== deckId)
        throw new Error('保存先のデッキが一致しません');
      this.records[saved.deckId] = saved;
      return saved;
    } catch (reason) {
      this.errors.set(key, reason instanceof Error ? reason.message : '保存データが不正です');
      return null;
    }
  }
  get snapshot() {
    return {
      saved: this.records,
      latestDeckId: this.current?.deckId ?? null,
      invalidDeckIds: [...this.errors.keys()]
        .filter((key) => key.startsWith(this.archivePrefix))
        .map((key) => key.slice(this.archivePrefix.length)),
      unreadableCurrent: this.errors.has(this.currentKey),
      error: [...this.errors.values()].join('\n'),
    };
  }
  save(deckId: string, mode: PracticeMode, session: GameSession) {
    const archiveKey = `${this.archivePrefix}${deckId}`;
    if (session.phase === 'complete') {
      if (this.current?.deckId === deckId) {
        this.storage.removeItem(this.currentKey);
        this.current = null;
        this.raw = null;
      }
      if (this.archives.has(deckId)) this.storage.removeItem(archiveKey);
      this.archives.delete(deckId);
      this.errors.delete(archiveKey);
      this.records = Object.fromEntries(
        Object.entries(this.records).filter(([id]) => id !== deckId),
      );
      return;
    }
    const next = checkpointSchema.parse({ deckId, mode, session });
    const raw = JSON.stringify(next);
    if (raw === this.raw) return;
    if (this.current && this.current.deckId !== deckId && this.raw !== null) {
      this.storage.setItem(`${this.archivePrefix}${this.current.deckId}`, this.raw);
      this.archives.add(this.current.deckId);
    }
    this.storage.setItem(this.currentKey, raw);
    this.current = next;
    this.raw = raw;
    this.records = { ...this.records, [deckId]: next };
    this.errors.delete(this.currentKey);
    if (this.archives.has(deckId)) {
      this.storage.removeItem(archiveKey);
      this.archives.delete(deckId);
      this.errors.delete(archiveKey);
    }
  }
}
