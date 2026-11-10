import { describe, expect, it } from 'vite-plus/test';
import { createSession, nextRound, revealAnswer, startRound, takeCard } from './session.js';
import { pauseQuestion, resumeQuestion } from './timing.js';
import { restoreSession } from './checkpoint.js';

describe('出題中だけの所要時間', () => {
  it('中断・保存・再開を挟んでも待ち時間を加算しない', () => {
    const playing = startRound(
      createSession(['a', 'b'], 2, 2, () => 0.5),
      1000,
    );
    const paused = pauseQuestion(playing, 1500);
    expect(paused.elapsedMs).toBe(500);
    expect(pauseQuestion(paused, 9000)).toBe(paused);
    const restored = startRound(restoreSession(paused), 10000);
    const answer = restored.order[0]!;
    const correct = takeCard(restored, answer, 10200);
    expect(correct.elapsedMs).toBe(700);
    expect(correct.times).toEqual([700]);
    expect(pauseQuestion(correct, 20000)).toBe(correct);
    const next = startRound(nextRound(correct), 30000);
    expect(next.roundElapsedMs).toBe(0);
    expect(revealAnswer(next, 30300).elapsedMs).toBe(1000);
  });
  it('表示を戻した時だけ計測を再開し、同じ通知を重ねても二重計測しない', () => {
    const playing = startRound(
      createSession(['a'], 1, 1, () => 0.5),
      0,
    );
    const resumed = resumeQuestion(pauseQuestion(playing, 100), 1000);
    expect(resumeQuestion(resumed, 2000)).toBe(resumed);
    expect(revealAnswer(resumed, 1100).elapsedMs).toBe(200);
  });
});
