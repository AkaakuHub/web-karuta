import type { GameFeedback } from '../../domain/game/session.js';

interface Tone {
  frequency: number;
  endFrequency: number;
  offset: number;
  duration: number;
  waveform: OscillatorType;
}
function chime(frequencies: readonly number[]): Tone[] {
  return frequencies.map((frequency, index) => ({
    frequency,
    endFrequency: frequency,
    offset: index * 0.1,
    duration: 0.18,
    waveform: 'sine',
  }));
}
const tones: Readonly<Record<GameFeedback['kind'], readonly Tone[]>> = {
  correct: chime([523.25, 659.25, 783.99, 1046.5]),
  incorrect: [
    { frequency: 196, endFrequency: 82.4, offset: 0, duration: 0.24, waveform: 'triangle' },
  ],
  skipped: chime([392, 329.63]),
  complete: chime([523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]),
};

export class GameSound {
  private context: AudioContext | null = null;
  async unlock() {
    this.context ??= new AudioContext();
    if (this.context.state === 'suspended') await this.context.resume();
  }

  async play(kind: GameFeedback['kind'], volume: number) {
    if (volume === 0) return;
    await this.unlock();
    const context = this.context;
    if (!context) return;
    const start = context.currentTime;
    for (const tone of tones[kind]) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const at = start + tone.offset;
      oscillator.type = tone.waveform;
      oscillator.frequency.setValueAtTime(tone.frequency, at);
      oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency, at + tone.duration);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime(0.2 * volume, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + tone.duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
      oscillator.start(at);
      oscillator.stop(at + tone.duration);
    }
  }

  async dispose() {
    if (this.context && this.context.state !== 'closed') await this.context.close();
  }
}
