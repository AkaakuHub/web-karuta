import { vi } from 'vite-plus/test';
import { GameAudio } from '../../infrastructure/audio/gameAudio.js';

class Source {
  offset = 0;
  buffer: AudioBuffer | null = null;
  onended: ((event: Event) => void) | null = null;
  connected = false;
  connect() {
    this.connected = true;
  }
  disconnect() {
    this.connected = false;
  }
  start(_when: number, offset: number) {
    this.offset = offset;
  }
  stop() {}
  finish() {
    this.onended?.(new Event('ended'));
  }
}
export function buffer(): AudioBuffer {
  const data = new Float32Array(4800);
  return {
    duration: 0.1,
    length: data.length,
    numberOfChannels: 1,
    sampleRate: 48000,
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
  sources: Source[] = [];
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
    this.sources.push(source);
    return source;
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
