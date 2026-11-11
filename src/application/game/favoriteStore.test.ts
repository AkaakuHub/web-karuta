import { expect, it } from 'vite-plus/test';
import { FavoriteStore } from '../../infrastructure/game/favoriteStore.js';

it('同じ保存先でスターを復元し、新しく保存した曲から並べる', () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const store = new FavoriteStore(storage, 'favorites');
  store.toggle('one');
  store.toggle('two');
  expect(new FavoriteStore(storage, 'favorites').ids).toEqual(['two', 'one']);
  store.toggle('one');
  expect(new FavoriteStore(storage, 'favorites').ids).toEqual(['two']);
});

it('保存に失敗したら画面の保存状態を変えない', () => {
  const store = new FavoriteStore(
    {
      getItem: () => '["one"]',
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    },
    'favorites',
  );
  expect(() => store.toggle('two')).toThrow();
  expect(store.ids).toEqual(['one']);
});
