import { AudioOutputMonitor } from './outputClock.js';

export function createAudioOutput(level: number, normalizationLevel: number) {
  const context = new AudioContext();
  const gain = context.createGain();
  const normalization = context.createGain();
  gain.gain.value = level;
  normalization.gain.value = normalizationLevel;
  normalization.connect(gain);
  gain.connect(context.destination);
  const analyser = context.createAnalyser();
  analyser.fftSize = 256;
  gain.connect(analyser);
  const samples = new Float32Array(analyser.fftSize);
  let silentChecks = 0;
  let clock = new AudioOutputMonitor();
  return {
    context,
    gain,
    normalization,
    reset() {
      clock = new AudioOutputMonitor();
      silentChecks = 0;
    },
    fault(buffer: AudioBuffer, position: number, startedAt: number | null) {
      if (!clock.check(context.getOutputTimestamp(), performance.now())) return 'clock';
      if (gain.gain.value < 0.02 || startedAt === null || context.currentTime - startedAt < 0.15)
        return null;
      analyser.getFloatTimeDomainData(samples);
      if (
        samples.some((sample) => Math.abs(sample) > 0.00003) ||
        !expectsSignal(buffer, position)
      ) {
        silentChecks = 0;
        return null;
      }
      return ++silentChecks >= 3 ? 'signal' : null;
    },
    close() {
      normalization.disconnect();
      gain.disconnect();
      analyser.disconnect();
      return context.close();
    },
  };
}

function expectsSignal(buffer: AudioBuffer, position: number) {
  const at = Math.floor(position * buffer.sampleRate);
  const margin = Math.ceil(0.025 * buffer.sampleRate);
  const from = Math.max(0, at - margin);
  const to = Math.min(buffer.length, at + margin);
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel);
    for (let sample = from; sample < to; sample += 4)
      if (Math.abs(data[sample]!) > 0.01) return true;
  }
  return false;
}
