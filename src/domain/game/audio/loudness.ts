import { kWeighting } from './kWeighting.js';

export function measureLoudness(channels: readonly Float32Array[], sampleRate: number) {
  const length = channels[0]?.length ?? 0;
  // 冒頭30秒を基準にし、長い音源でも周波数補正の処理量を制限する。
  const analysisLength = Math.min(length, Math.round(sampleRate * 30));
  const step = Math.max(1, Math.round(sampleRate / 10));
  const energies = new Float64Array(Math.ceil(analysisLength / step));
  const { shelf, highPass } = kWeighting(sampleRate);
  let peak = 0;
  for (const [channelIndex, channel] of channels.entries()) {
    let x1 = 0;
    let x2 = 0;
    let shelf1 = 0;
    let shelf2 = 0;
    let output1 = 0;
    let output2 = 0;
    const lfe = channels.length === 6 && channelIndex === 3;
    const surround =
      channels.length === 4 ? channelIndex >= 2 : channelIndex >= (channels.length === 6 ? 4 : 3);
    const weight = lfe ? 0 : surround ? 1.41 : 1;
    for (let block = 0; block < energies.length; block++) {
      const end = Math.min(analysisLength, (block + 1) * step);
      let energy = 0;
      for (let index = block * step; index < end; index++) {
        const sample = channel[index]!;
        peak = Math.max(peak, Math.abs(sample));
        const filtered =
          shelf.b0 * sample + shelf.b1 * x1 + shelf.b2 * x2 - shelf.a1 * shelf1 - shelf.a2 * shelf2;
        const output =
          filtered - 2 * shelf1 + shelf2 - highPass.a1 * output1 - highPass.a2 * output2;
        x2 = x1;
        x1 = sample;
        shelf2 = shelf1;
        shelf1 = filtered;
        output2 = output1;
        output1 = output;
        energy += output * output;
      }
      energies[block] = energies[block]! + energy * weight;
    }
    for (let index = analysisLength; index < length; index++)
      peak = Math.max(peak, Math.abs(channel[index]!));
  }
  // ITU-R BS.1770: 400ms blocks, 75% overlap, -70 LUFS / -10 LU gates.
  const absoluteGate = 10 ** ((-70 + 0.691) / 10);
  const blocks: number[] = [];
  const completeSteps = Math.floor(analysisLength / step);
  for (let block = 0; block + 4 <= completeSteps; block++) {
    const power =
      (energies[block]! + energies[block + 1]! + energies[block + 2]! + energies[block + 3]!) /
      (step * 4);
    if (power >= absoluteGate) blocks.push(power);
  }
  if (!blocks.length) return { lufs: null, peak };
  const relativeGate = (blocks.reduce((sum, power) => sum + power, 0) / blocks.length) * 0.1;
  const gated = blocks.filter((power) => power >= relativeGate);
  const power = gated.reduce((sum, value) => sum + value, 0) / gated.length;
  return { lufs: -0.691 + 10 * Math.log10(power), peak };
}
