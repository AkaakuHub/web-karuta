import { describe, expect, it } from 'vite-plus/test';
import {
  finishSession,
  canSeekRound,
  createSession,
  nextRound,
  revealAnswer,
  startRound,
  takeCard,
} from './session.js';

describe('かるたの進行', () => {
  it('答えの発表後だけシークを許可し、次の出題では再び制限する', () => {
    const ready = createSession(['1', '2', '3'], 3, 3, () => 0.5);
    const playing = startRound(ready, 0);
    const answer = playing.order[0]!;
    const wrong = playing.board.find((id) => id !== answer)!;
    expect(canSeekRound(ready)).toBe(false);
    expect(canSeekRound(playing)).toBe(false);
    expect(canSeekRound(revealAnswer(playing, 100))).toBe(true);
    const missed = takeCard(playing, wrong, 100);
    expect(canSeekRound(missed)).toBe(false);
    expect(canSeekRound(revealAnswer(missed, 200))).toBe(true);
    const correct = takeCard(missed, answer, 200);
    expect(canSeekRound(correct)).toBe(true);
    expect(canSeekRound(takeCard(playing, answer, 200))).toBe(true);
    const next = nextRound(correct);
    expect(canSeekRound(next)).toBe(false);
    expect(canSeekRound(startRound(next, 300))).toBe(false);
  });
  it('重複した曲を出題せず、正解の札だけを取れる', () => {
    const ready = createSession(['1', '2', '2', '3'], 3, 3, () => 0.5);
    expect(new Set(ready.order).size).toBe(3);
    const playing = startRound(ready, 1000);
    const answer = playing.order[0];
    if (!answer) throw new Error('出題がありません');
    const wrong = playing.order.find((id) => id !== answer);
    if (!wrong) throw new Error('別の札がありません');
    const missed = takeCard(playing, wrong, 1200);
    expect(missed.mistakes).toBe(1);
    expect(missed.results).toEqual([]);
    expect(takeCard(missed, wrong, 1300).mistakes).toBe(1);
    const correct = takeCard(missed, answer, 1500);
    expect(correct.phase).toBe('revealed');
    expect(correct.times).toEqual([500]);
    expect(takeCard(correct, answer, 1600)).toBe(correct);
  });
  it('最後の札を終えたら終了し、再出題しない', () => {
    let session = createSession(['1', '2'], 2, 2, () => 0.5);
    for (let i = 0; i < 2; i++) session = nextRound(revealAnswer(startRound(session, 0), 100));
    expect(session.phase).toBe('complete');
    expect(session.skipped).toBe(2);
    expect(nextRound(session)).toBe(session);
  });
  it('再生前には札を取れず、1曲の復習を最後まで進められる', () => {
    const session = createSession(['1', '2'], 2, 2, () => 0.5);
    expect(takeCard(session, '1', 0)).toBe(session);
    const single = createSession(['1'], 1, 2, () => 0.5);
    expect(nextRound(revealAnswer(startRound(single, 0), 100)).phase).toBe('complete');
    expect(() => createSession([], 1, 2, () => 0.5)).toThrow();
  });
  it('取った位置に控えの札を補充し、表示中の札だけを最後まで重複なく出題する', () => {
    let session = createSession(
      Array.from({ length: 20 }, (_, index) => String(index)),
      20,
      6,
      () => 0.5,
    );
    expect(session.board).toHaveLength(6);
    expect(session.reserve).toHaveLength(14);
    expect(new Set(session.order).size).toBe(20);
    for (let round = 0; round < 20; round++) {
      const before = startRound(session, 1000);
      const answer = before.order[before.round]!;
      const slot = before.board.indexOf(answer);
      expect(slot).toBeGreaterThanOrEqual(0);
      const correct = takeCard(before, answer, 1200);
      expect(before.board[slot]).toBe(answer);
      expect(correct.board[slot]).toBe(before.reserve[0] ?? null);
      expect(correct.lastTaken).toEqual({ songId: answer, slot, kind: 'correct' });
      expect(correct.board.filter((_, index) => index !== slot)).toEqual(
        before.board.filter((_, index) => index !== slot),
      );
      session = nextRound(correct);
    }
    expect(session.phase).toBe('complete');
    expect(session.results).toHaveLength(20);
    expect(session.board.every((id) => id === null)).toBe(true);
  });
  it('控えの札は取れず、答えを見送った場合にも同じ位置に補充する', () => {
    const playing = startRound(
      createSession(['1', '2', '3', '4'], 4, 2, () => 0.5),
      1000,
    );
    expect(takeCard(playing, playing.reserve[0]!, 1100)).toBe(playing);
    const answer = playing.order[0]!;
    const slot = playing.board.indexOf(answer);
    const revealed = revealAnswer(playing, 100);
    expect(revealed.board[slot]).toBe(playing.reserve[0]);
    expect(revealed.lastTaken?.kind).toBe('skipped');
    expect(revealed.skipped).toBe(1);
  });
});

it('ひとり練習の途中終了で取得結果と得点を保持し、計時を止める', () => {
  const playing = startRound(
    createSession(['1', '2', '3'], 3, 3, () => 0.5),
    100,
  );
  const won = takeCard(playing, playing.order[0]!, 200);
  const next = startRound(nextRound(won), 300);
  const finished = finishSession(next, 500);
  expect(finished.phase).toBe('complete');
  expect(finished.results).toEqual(won.results);
  expect(finished.startedAt).toBeNull();
  expect(finishSession(finished, 600)).toBe(finished);
});
