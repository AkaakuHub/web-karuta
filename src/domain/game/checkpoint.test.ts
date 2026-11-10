import { describe, expect, it } from 'vite-plus/test';
import { checkpointSchema, restoreSession } from './checkpoint.js';
import { createSession, nextRound, revealAnswer, startRound, takeCard } from './session.js';

describe('ひとり練習の続き', () => {
  it('再読み込み後も札とお手つきを保持し、未回答の曲から再開する', () => {
    const playing = startRound(
      createSession(['a', 'b', 'c'], 3, 2, () => 0.5),
      100,
    );
    const wrong = playing.board.find((id) => id !== playing.order[0]);
    if (!wrong) throw new Error('別の札がありません');
    const missed = takeCard(playing, wrong, 200);
    const saved = checkpointSchema.parse(
      JSON.parse(JSON.stringify({ deckId: 'deck', mode: 'failed', session: missed })),
    );
    const restored = restoreSession(saved.session);
    expect(restored.phase).toBe('ready');
    expect(restored.startedAt).toBeNull();
    expect(restored.board).toEqual(missed.board);
    expect(restored.order).toEqual(missed.order);
    expect(restored.incorrect).toEqual([wrong]);
    expect(restored.mistakes).toBe(1);
    expect(takeCard(startRound(restored, 1000), wrong, 1100).mistakes).toBe(1);
  });
  it('答えの発表後は取得情報を保持し、次の曲へ重複なく進む', () => {
    const revealed = revealAnswer(
      startRound(
        createSession(['a', 'b', 'c'], 3, 2, () => 0.5),
        0,
      ),
      100,
    );
    const saved = checkpointSchema.parse({ deckId: 'deck', mode: 'all', session: revealed });
    const restored = restoreSession(saved.session);
    expect(restored.phase).toBe('revealed');
    expect(restored.lastTaken).toEqual(revealed.lastTaken);
    expect(restored.results).toEqual(revealed.results);
    expect(nextRound(restored).round).toBe(1);
    expect(nextRound(restored).results).toHaveLength(1);
  });
  it('札や取得記録が欠けたデータを再開可能として扱わない', () => {
    const session = createSession(['a', 'b'], 2, 2, () => 0.5);
    expect(
      checkpointSchema.safeParse({
        deckId: 'deck',
        mode: 'all',
        session: { ...session, board: [null, null] },
      }).success,
    ).toBe(false);
    expect(
      checkpointSchema.safeParse({ deckId: 'deck', mode: 'all', session: { ...session, round: 1 } })
        .success,
    ).toBe(false);
  });
});
