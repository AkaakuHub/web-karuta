import { normalizationGain } from '../../domain/game/audioLevel.js';
import { diagnostic } from '../diagnostics/diagnostics.js';

export async function decodeAudio(context: AudioContext, data: ArrayBuffer) {
  diagnostic('audio.decode.start', { bytes: data.byteLength });
  const started = performance.now();
  const buffer = await context.decodeAudioData(data);
  diagnostic('audio.decode.done', {
    duration: buffer.duration,
    channels: buffer.numberOfChannels,
    sampleRate: buffer.sampleRate,
    pcmBytes: buffer.length * buffer.numberOfChannels * 4,
    decodeMs: Math.round(performance.now() - started),
  });
  return buffer;
}

export function audioNormalization(buffer: AudioBuffer): number {
  return normalizationGain(
    Array.from({ length: buffer.numberOfChannels }, (_, channel) => buffer.getChannelData(channel)),
    buffer.sampleRate,
  );
}
