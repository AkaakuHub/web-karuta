export function createAudioOutput(level: number, normalizationLevel: number) {
  const context = new AudioContext();
  const gain = context.createGain();
  const normalization = context.createGain();
  gain.gain.value = level;
  normalization.gain.value = normalizationLevel;
  normalization.connect(gain);
  gain.connect(context.destination);
  return { context, gain, normalization };
}
