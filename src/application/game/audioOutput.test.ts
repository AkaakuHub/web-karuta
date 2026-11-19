import { expect, it } from 'vite-plus/test';
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
