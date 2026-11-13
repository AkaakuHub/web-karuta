import { vi } from 'vite-plus/test';
import { GameAudio } from '../../infrastructure/audio/gameAudio.js';

class Source {
  priming = false;
  offset = 0;
  when = 0;
  buffer: AudioBuffer | null = null;
  onended: ((event: Event) => void) | null = null;
  connected = false;
  connect() {
    this.connected = true;
  }
  disconnect() {
    this.connected = false;
  }
  start(when = 0, offset = 0) {
    this.when = when;
    this.offset = offset;
    if (this.buffer?.length === 1) {
      this.priming = true;
      queueMicrotask(() => this.finish());
    }
  }
  stop() {}
  finish() {
    this.onended?.(new Event('ended'));
  }
}
export function buffer(length = 4800, sampleRate = 48000): AudioBuffer {
  const data = new Float32Array(length);
  return {
    duration: length / sampleRate,
    length: data.length,
    numberOfChannels: 1,
    sampleRate,
    getChannelData: () => data,
    copyFromChannel: (target) => target.set(data),
    copyToChannel: (source) => data.set(source),
  };
}
class Context extends EventTarget {
  static instances: Context[] = [];
  static clockFrozen = false;
  currentTime = 0;
  state = 'suspended';
  destination = {};
  sampleRate = 48000;
  private nodes: Source[] = [];
  get sources() {
    return this.nodes.filter((source) => !source.priming);
  }
  get primingSources() {
    return this.nodes.filter((source) => source.priming);
  }
  createBuffer(channels: number, length: number, sampleRate: number) {
    return { ...buffer(length, sampleRate), numberOfChannels: channels };
  }
  gains: { gain: { value: number } }[] = [];
  private clock: ReturnType<typeof setInterval> | null = null;
  decode: (data: ArrayBuffer) => Promise<AudioBuffer> = async () => buffer();
  constructor() {
    super();
    Context.instances.push(this);
  }
  createGain() {
    const node = { gain: { value: 1 }, connect() {}, disconnect() {} };
    this.gains.push(node);
    return node;
  }
  createBufferSource() {
    const source = new Source();
    this.nodes.push(source);
    return source;
  }
  getOutputTimestamp() {
    return { contextTime: this.currentTime, performanceTime: performance.now() || 1 };
  }
  decodeAudioData(data: ArrayBuffer) {
    return this.decode(data);
  }
  async resume() {
    this.state = 'running';
    this.dispatchEvent(new Event('statechange'));
    if (this.clock) clearInterval(this.clock);
    this.clock = setInterval(() => {
      if (this.state === 'running' && !Context.clockFrozen) this.currentTime += 0.01;
    }, 10);
  }
  async close() {
    this.state = 'closed';
    if (this.clock) clearInterval(this.clock);
    this.clock = null;
  }
}
export function setup(onRecover?: () => void) {
  const page = Object.assign(new EventTarget(), { hidden: false });
  vi.stubGlobal('document', page);
  vi.stubGlobal('window', new EventTarget());
  vi.stubGlobal('AudioContext', Context);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => new Response(new Uint8Array([1]))),
  );
  const report =
    vi.fn<
      (
        progress: { position: number; duration: number },
        playing: boolean,
        needsResume: boolean,
      ) => void
    >();
  const audio = new GameAudio(report, onRecover);
  return {
    audio,
    context: Context.instances.at(-1)!,
    contexts: Context.instances,
    contextType: Context,
    page,
    report,
  };
}
export function resetAudioHarness() {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  Context.instances = [];
  Context.clockFrozen = false;
}
