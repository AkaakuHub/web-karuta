import { z } from 'zod';

type FavoriteStorage = Pick<Storage, 'getItem' | 'setItem'>;
export class FavoriteStore {
  private value: string[];
  constructor(
    private readonly storage: FavoriteStorage,
    private readonly key: string,
  ) {
    const saved = storage.getItem(key);
    this.value = saved === null ? [] : z.array(z.string().min(1)).parse(JSON.parse(saved));
  }
  get ids(): readonly string[] {
    return this.value;
  }
  toggle(id: string): readonly string[] {
    const next = this.value.includes(id)
      ? this.value.filter((value) => value !== id)
      : [id, ...this.value];
    this.storage.setItem(this.key, JSON.stringify(next));
    this.value = next;
    return next;
  }
}
