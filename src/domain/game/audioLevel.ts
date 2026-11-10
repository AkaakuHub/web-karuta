import { measureLoudness } from './audio/loudness.js';

export function normalizationGain(channels: readonly Float32Array[], sampleRate: number): number {
  const { lufs, peak } = measureLoudness(channels, sampleRate);
  if (lufs === null || peak === 0) return 1;
  // モノラルはWeb Audioで左右へ同じ信号が出るため、2チャンネル分で評価する。
  const playbackLufs = lufs + (channels.length === 1 ? 10 * Math.log10(2) : 0);
  return Math.min(4, 10 ** ((-18 - playbackLufs) / 20), 10 ** (-1 / 20) / peak);
}
