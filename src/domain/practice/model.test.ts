import { describe, expect, it } from 'vite-plus/test';
import { DefaultScheduler } from 'ts-fsrs';
import { matchesPractice, practiceSchema, reviewPractice } from './model.js';

describe('ひとり練習の復習記録', () => {
  it('失敗を保存して復習時刻に選べるようにし、正解後に失敗対象から外す', async () => {
    const scheduler = await DefaultScheduler({ enableFuzz: false });
    const now = new Date('2026-11-08T00:00:00Z');
    const failed = reviewPractice(scheduler, undefined, 'song', false, now);
    const saved = practiceSchema.parse(JSON.parse(JSON.stringify({ song: failed })));
    expect(saved.song?.misses).toBe(1);
    expect(matchesPractice(saved.song, 'failed', now)).toBe(true);
    expect(matchesPractice(saved.song, 'weak', now)).toBe(true);
    expect(matchesPractice(saved.song, 'due', now)).toBe(false);
    expect(matchesPractice(saved.song, 'due', failed.card.dueAt)).toBe(true);
    const correct = reviewPractice(scheduler, saved.song, 'song', true, failed.card.dueAt);
    expect(correct.successes).toBe(1);
    expect(correct.misses).toBe(1);
    expect(matchesPractice(correct, 'failed', correct.card.dueAt)).toBe(false);
    expect(correct.card.dueAt.getTime()).toBeGreaterThan(failed.card.dueAt.getTime());
  });
  it('未出題曲を復習・失敗・苦手へ混ぜず、初回正解を苦手扱いしない', async () => {
    const scheduler = await DefaultScheduler({ enableFuzz: false });
    const now = new Date('2026-11-08T00:00:00Z');
    expect(matchesPractice(undefined, 'all', now)).toBe(true);
    for (const mode of ['due', 'failed', 'weak'] as const)
      expect(matchesPractice(undefined, mode, now)).toBe(false);
    const correct = reviewPractice(scheduler, undefined, 'song', true, now);
    expect(matchesPractice(correct, 'weak', now)).toBe(false);
    expect(matchesPractice(correct, 'failed', now)).toBe(false);
  });
});
