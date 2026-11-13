import { afterEach, expect, it } from 'vite-plus/test';
import { setup, resetAudioHarness } from './audioHarness.js';
afterEach(resetAudioHarness);

it('接続断から同じ曲を準備し直しても取得とデコードを繰り返さない', async () => {
  const { audio, context } = setup();
  try {
    await audio.prepare('/track/one');
    await audio.resume();
    const original = context.sources.at(-1)!.buffer;
    audio.cancelPreparation();
    await audio.prepare('/track/one');
    await audio.resume();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(context.sources.at(-1)!.buffer).toBe(original);
  } finally {
    await audio.dispose();
  }
});
it('保持する音声は現在の1曲だけにし、別の曲と明示的な破棄では取り直す', async () => {
  const { audio } = setup();
  try {
    await audio.prepare('/track/one');
    await audio.prepare('/track/two');
    await audio.prepare('/track/one');
    expect(fetch).toHaveBeenCalledTimes(3);
    audio.clear();
    await audio.prepare('/track/one');
    expect(fetch).toHaveBeenCalledTimes(4);
  } finally {
    await audio.dispose();
  }
});

it('切断時の予約を破棄し、音声の再利用時に古い開始時刻を使わない', async () => {
  const { audio, context } = setup();
  try {
    await audio.prepare('/track/one');
    await audio.schedule(10000, () => 0, new AbortController().signal);
    audio.cancelPreparation();
    await audio.resume();
    expect(context.sources.at(-1)!.when).toBeLessThanOrEqual(context.currentTime);
    expect(fetch).toHaveBeenCalledTimes(1);
  } finally {
    await audio.dispose();
  }
});
