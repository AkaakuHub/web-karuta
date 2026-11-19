import { describe, expect, it } from 'vite-plus/test';
import { correctCount, resultGroup } from './results.js';

describe('共通の得点と取得者', () => {
  it('自分と相手の正解数を取得結果から同じ規則で集計する', () => {
    const results = [
      { id: 'one', owner: 'a' },
      { id: 'two', owner: 'b' },
      { id: 'three', owner: null },
      { id: 'four', owner: 'a' },
    ];
    expect(correctCount(results, 'a')).toBe(2);
    expect(correctCount(results, 'b')).toBe(1);
  });
  it('取得者を自分・相手・未取得に分類する', () => {
    expect(resultGroup('a', 'a')).toBe('mine');
    expect(resultGroup('b', 'a')).toBe('opponent');
    expect(resultGroup(null, 'a')).toBe('unclaimed');
  });
});
