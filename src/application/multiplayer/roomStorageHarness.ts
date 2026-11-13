import type { RoomStorage } from '../../worker/multiplayer/roomPersistence.js';

export class Storage implements RoomStorage {
  values = new Map<string, unknown>();
  writes: Record<string, unknown>[] = [];
  alarms: number[] = [];
  alarm: number | null = null;
  async get<T>(key: string): Promise<T | undefined> {
    return this.values.get(key) as T | undefined;
  }
  async put(values: Record<string, unknown>) {
    this.writes.push(structuredClone(values));
    for (const [key, value] of Object.entries(values)) this.values.set(key, structuredClone(value));
  }
  async getAlarm() {
    return this.alarm;
  }
  async setAlarm(value: number) {
    this.alarm = value;
    this.alarms.push(value);
  }
  deletions = 0;
  async deleteAll() {
    this.deletions++;
    this.values.clear();
  }
}
