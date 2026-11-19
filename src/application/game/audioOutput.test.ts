import { afterEach, expect, it, vi } from 'vite-plus/test';
import { buffer, resetAudioHarness, setup } from './audioHarness.js';
import { audibleReactionMs } from '../../domain/game/audioTiming.js';
import { outputContextTime } from '../../infrastructure/audio/outputClock.js';

it('処理が200ms遅れても入力イベントが発生した出力時刻から同じ反応時間を測る', () => {
  const sample = { contextTime: 2.1, performanceTime: 1100 };
  const eventTime = 1000;
  const inputContextTime = outputContextTime(sample, eventTime);
  expect(audibleReactionMs(inputContextTime, 1.5, 0)).toBeCloseTo(500);
  const laterSample = { contextTime: 2.3, performanceTime: 1300 };
  const delayedInputContextTime = outputContextTime(laterSample, eventTime);
  expect(audibleReactionMs(delayedInputContextTime, 1.5, 0)).toBeCloseTo(500);
});

afterEach(resetAudioHarness);

it('音源が無音でないのに出力が無音なら時計だけで再生を続けない', async () => {
  vi.useFakeTimers();
  const { audio, contextType, contexts, report } = setup();
  const track = buffer(480000);
  track.getChannelData(0).fill(0.3);
  vi.spyOn(contextType.prototype, 'decodeAudioData').mockResolvedValue(track);
  try {
    await audio.play('/track/one');
    await vi.advanceTimersByTimeAsync(1800);
    expect(contexts).toHaveLength(2);
    expect(contexts[1]!.sources[0]!.offset).toBe(0);
    expect(report).toHaveBeenLastCalledWith(expect.objectContaining({ duration: 10 }), false, true);
    expect(fetch).toHaveBeenCalledTimes(1);
  } finally {
    await audio.dispose();
  }
});
