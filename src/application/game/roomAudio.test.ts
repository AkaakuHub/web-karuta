import { afterEach, expect, it, vi } from 'vite-plus/test';
import { setup, resetAudioHarness } from './audioHarness.js';

afterEach(resetAudioHarness);

it('中断と復帰イベントが重なっても対戦の再同期は一度だけ行う', async () => {
  const recover = vi.fn();
  const { audio, context, page } = setup(recover);
  try {
    await audio.play('/track');
    page.hidden = true;
    context.state = 'interrupted';
    context.dispatchEvent(new Event('statechange'));
    page.hidden = false;
    page.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pageshow'));
    expect(recover).toHaveBeenCalledTimes(1);
  } finally {
    await audio.dispose();
  }
});

it('手動で対戦の音声を復帰しても停止位置ではなく現在の時刻へ追いつく', async () => {
  const { audio, context, contexts } = setup(vi.fn());
  let now = 0;
  try {
    await audio.prepare('/track');
    await audio.schedule(0, () => now, new AbortController().signal);
    context.state = 'interrupted';
    context.dispatchEvent(new Event('statechange'));
    now = 40;
    await audio.resume();
    expect(contexts.at(-1)!.sources[0]!.offset).toBeCloseTo(0.04, 1);
    expect(fetch).toHaveBeenCalledTimes(1);
  } finally {
    await audio.dispose();
  }
});

it('runningのまま音声時計が止まっても端末だけを復帰処理へ送る', async () => {
  vi.useFakeTimers();
  const recover = vi.fn();
  const { audio, contextType } = setup(recover);
  try {
    await audio.play('/track');
    contextType.clockFrozen = true;
    await vi.advanceTimersByTimeAsync(800);
    expect(recover).toHaveBeenCalledTimes(1);
    expect(() => audio.reactionTime(performance.now())).toThrow();
  } finally {
    await audio.dispose();
  }
});
