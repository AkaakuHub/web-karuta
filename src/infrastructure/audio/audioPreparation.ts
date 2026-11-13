import { audioNormalization } from './decodeAudio.js';
import { AudioDecodeQueue } from './audioDecodeQueue.js';
import { fetchAudio } from './fetchAudio.js';

export class AudioPreparation {
  private controller: AbortController | null = null;
  private cached: { url: string; buffer: AudioBuffer; normalization: number } | null = null;
  private decoder: AudioDecodeQueue;
  constructor(decode: (data: ArrayBuffer) => Promise<AudioBuffer>) {
    this.decoder = new AudioDecodeQueue(decode);
  }
  get active() {
    return this.controller !== null;
  }
  async load(url: string) {
    this.cancel();
    const controller = new AbortController();
    this.controller = controller;
    if (this.cached?.url === url) return { ...this.cached, signal: controller.signal };
    this.cached = null;
    const data = await fetchAudio(url, controller.signal);
    const buffer = await this.decoder.run(data, controller.signal);
    if (!buffer || controller.signal.aborted) return null;
    this.cached = { url, buffer, normalization: audioNormalization(buffer) };
    return { ...this.cached, signal: controller.signal };
  }
  cancel() {
    this.controller?.abort();
    this.controller = null;
  }
  clear() {
    this.cancel();
    this.cached = null;
  }
}
