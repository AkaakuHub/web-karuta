import { expect, it } from 'vite-plus/test';
import { normalizationGain } from './audioLevel.js';
import { measureLoudness } from './audio/loudness.js';

function tone(amplitude: number, seconds = 2, frequency = 1000, sampleRate = 48000) {
  return Float32Array.from(
    { length: sampleRate * seconds },
    (_, index) => amplitude * Math.sin((index * Math.PI * 2 * frequency) / sampleRate),
  );
}

it('EBU Tech 3341の1kHzステレオ基準信号を±0.1LUで測定する', () => {
  // https://tech.ebu.ch/docs/tech/tech3341.pdf — test 1
  for (const sampleRate of [44100, 48000]) {
    const signal = tone(10 ** (-23 / 20), 20, 1000, sampleRate);
    expect(measureLoudness([signal, signal], sampleRate).lufs).toBeCloseTo(-23, 1);
  }
});

it('大きい曲を下げ、小さい曲を上げて同じラウドネスに揃える', () => {
  const quietGain = normalizationGain([tone(0.05)], 48000);
  const loudGain = normalizationGain([tone(0.8)], 48000);
  expect(quietGain).toBeGreaterThan(1);
  expect(loudGain).toBeLessThan(1);
  expect(0.05 * quietGain).toBeCloseTo(0.8 * loudGain);
  const normalized = tone(0.8 * loudGain);
  expect(measureLoudness([normalized, normalized], 48000).lufs).toBeCloseTo(-18, 2);
});

it('周波数による聴感差を考慮し、モノラルと同じ音のステレオを揃える', () => {
  const signal = tone(0.2);
  expect(normalizationGain([signal], 48000)).toBeCloseTo(
    normalizationGain([signal, signal], 48000),
  );
  expect(normalizationGain([tone(0.2, 2, 5000)], 48000)).toBeLessThan(
    normalizationGain([signal], 48000),
  );
  expect(measureLoudness([tone(0.2, 2, 50)], 48000).lufs!).toBeLessThan(
    measureLoudness([signal], 48000).lufs! - 4,
  );
});

it('無音や小さな背景音で通常の音を過剰に増幅しない', () => {
  const signal = tone(0.2, 10);
  const padded = tone(0.001, 20);
  padded.set(signal, 48000 * 2);
  const original = measureLoudness([signal], 48000).lufs!;
  expect(Math.abs(measureLoudness([padded], 48000).lufs! - original)).toBeLessThan(0.2);
});

it('増幅を4倍までに制限し、解析区間外も含む全チャンネルのピークを保護する', () => {
  const quiet = tone(0.002, 31);
  expect(normalizationGain([quiet], 48000)).toBe(4);
  const transient = quiet.slice();
  transient[transient.length - 1] = 1;
  expect(normalizationGain([quiet, transient], 48000)).toBeCloseTo(10 ** (-1 / 20));
  expect(normalizationGain([new Float32Array(48000)], 48000)).toBe(1);
  expect(normalizationGain([], 48000)).toBe(1);
});
