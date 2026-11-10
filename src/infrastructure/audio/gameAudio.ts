import type { TrackProgress } from './audioProgress.js';
import { playbackPosition } from '../../domain/game/playback.js';
import { normalizationGain } from '../../domain/game/audioLevel.js';
import { fetchAudio } from './fetchAudio.js';
import { AudioDecodeQueue } from './audioDecodeQueue.js';
import { diagnostic } from '../diagnostics/diagnostics.js';
import { resumeAudioContext } from './resumeAudioContext.js';

export class GameAudio {
  private context = new AudioContext();
  private decoder = new AudioDecodeQueue(async (data) => {
    diagnostic('audio.decode.start', { bytes: data.byteLength });
    const started = performance.now();
    const buffer = await this.context.decodeAudioData(data);
    diagnostic('audio.decode.done', {
      duration: buffer.duration,
      channels: buffer.numberOfChannels,
      sampleRate: buffer.sampleRate,
      pcmBytes: buffer.length * buffer.numberOfChannels * 4,
      decodeMs: Math.round(performance.now() - started),
    });
    return buffer;
  });
  private generation = 0;
  private gain = this.context.createGain();
  private normalization = this.context.createGain();
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private controller: AbortController | null = null;
  private offset = 0;
  private startedAt: number | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private interrupted = false;
  private renewContext = false;
  private verifyClock = false;
  private unlocking = 0;
  private unlockAttempt = 0;
  private playbackRevision = 0;
  private readonly visibilityChanged = () => {
    if (document.hidden) this.interrupt();
    else this.recover();
  };
  private readonly pageHidden = () => this.interrupt();
  private readonly pageShown = () => this.recover();
  private readonly contextChanged = () => {
    diagnostic('audio.context.state', { state: this.context.state });
    if (this.context.state !== 'running') this.interrupt();
    else this.recover();
    this.progress();
  };
  constructor(
    private readonly report: (
      progress: TrackProgress,
      playing: boolean,
      needsResume: boolean,
    ) => void,
    private readonly onRecover: (() => void) | null = null,
  ) {
    diagnostic('audio.context.created');
    this.normalization.connect(this.gain);
    this.gain.connect(this.context.destination);
    this.gain.gain.value = 0.7;
    document.addEventListener('visibilitychange', this.visibilityChanged);
    window.addEventListener('pagehide', this.pageHidden);
    window.addEventListener('pageshow', this.pageShown);
    this.context.addEventListener('statechange', this.contextChanged);
  }
  private get position() {
    return playbackPosition(
      this.offset,
      this.startedAt,
      this.context.currentTime,
      this.buffer?.duration ?? 0,
    );
  }
  private progress() {
    this.report(
      { position: this.position, duration: this.buffer?.duration ?? 0 },
      this.source !== null && this.context.state === 'running',
      this.interrupted,
    );
  }
  async unlock() {
    if (this.renewContext) this.replaceContext();
    const context = this.context;
    const attempt = ++this.unlockAttempt;
    this.unlocking++;
    try {
      await resumeAudioContext(context, this.verifyClock);
      if (context !== this.context) return false;
      this.verifyClock = false;
      return true;
    } catch (reason) {
      if (context === this.context && attempt === this.unlockAttempt) this.renewContext = true;
      throw reason;
    } finally {
      this.unlocking--;
    }
  }
  private replaceContext() {
    const previous = this.context;
    const volume = this.gain.gain.value;
    const normalization = this.normalization.gain.value;
    previous.removeEventListener('statechange', this.contextChanged);
    this.normalization.disconnect();
    this.gain.disconnect();
    void previous.close().catch(() => diagnostic('audio.context.close.failed'));
    this.context = new AudioContext();
    this.gain = this.context.createGain();
    this.normalization = this.context.createGain();
    this.normalization.connect(this.gain);
    this.gain.connect(this.context.destination);
    this.gain.gain.value = volume;
    this.normalization.gain.value = normalization;
    this.context.addEventListener('statechange', this.contextChanged);
    this.renewContext = false;
    this.verifyClock = true;
    diagnostic('audio.context.replaced', { position: this.offset });
  }
  async play(url: string): Promise<boolean> {
    this.clear();
    const generation = ++this.generation;
    try {
      if (!(await this.unlock())) return false;
      if (generation !== this.generation) return false;
      const ready = await this.prepare(url);
      if (!ready || generation !== this.generation) return false;
      await this.resume();
      return this.source !== null || this.interrupted;
    } catch (reason) {
      if (generation === this.generation && this.context.state !== 'running') {
        this.interrupted = true;
        this.progress();
      }
      throw reason;
    }
  }
  clear() {
    this.generation++;
    this.controller?.abort();
    this.controller = null;
    this.stop();
    this.buffer = null;
    this.offset = 0;
    this.progress();
  }
  async prepare(url: string): Promise<boolean> {
    this.stop();
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    this.buffer = null;
    this.offset = 0;
    this.progress();
    diagnostic('audio.fetch.start', { url });
    const data = await fetchAudio(url, controller.signal);
    diagnostic('audio.fetch.done', { bytes: data.byteLength });
    const buffer = await this.decoder.run(data, controller.signal);
    if (!buffer) return false;
    this.normalization.gain.value = normalizationGain(
      Array.from({ length: buffer.numberOfChannels }, (_, channel) =>
        buffer.getChannelData(channel),
      ),
      buffer.sampleRate,
    );
    this.buffer = buffer;
    this.progress();
    return true;
  }
  private start(delay: number, position: number) {
    this.stop();
    if (!this.buffer || position >= this.buffer.duration) return;
    if (document.hidden) {
      this.offset = position;
      this.interrupted = true;
      this.progress();
      return;
    }
    const source = this.context.createBufferSource();
    source.buffer = this.buffer;
    source.connect(this.normalization);
    this.offset = position;
    this.startedAt = this.context.currentTime + delay;
    this.source = source;
    source.onended = () => {
      if (this.source !== source) return;
      this.offset = this.buffer?.duration ?? 0;
      this.startedAt = null;
      this.source = null;
      this.releaseSource(source);
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      this.progress();
    };
    diagnostic('audio.source.start', {
      position,
      duration: this.buffer.duration,
      contextState: this.context.state,
    });
    source.start(this.startedAt, position);
    this.timer = setInterval(() => this.progress(), 200);
    this.progress();
  }
  async schedule(startsAt: number, serverNow: () => number, signal: AbortSignal) {
    const revision = this.playbackRevision;
    try {
      if (!(await this.unlock())) return;
    } catch (reason) {
      if (!signal.aborted && revision === this.playbackRevision && this.buffer) {
        this.interrupted = true;
        this.progress();
      }
      throw reason;
    }
    if (signal.aborted || revision !== this.playbackRevision) return;
    const delay = (startsAt - serverNow()) / 1000;
    this.start(Math.max(0, delay), Math.max(0, -delay));
  }
  async seek(position: number) {
    if (!this.buffer || !Number.isFinite(position)) return;
    const revision = this.playbackRevision;
    if (!(await this.unlock())) return;
    if (revision !== this.playbackRevision) return;
    this.start(0, Math.min(this.buffer.duration, Math.max(0, position)));
  }
  async resume() {
    diagnostic('audio.resume.request', {
      position: this.position,
      contextState: this.context.state,
    });
    if (!this.buffer) return;
    if (this.source) {
      await this.unlock();
      this.progress();
      return;
    }
    await this.seek(this.position >= this.buffer.duration ? 0 : this.position);
  }
  volume(value: number) {
    this.gain.gain.value = value;
  }
  stop() {
    this.playbackRevision++;
    this.interrupted = false;
    this.offset = this.position;
    this.startedAt = null;
    const source = this.source;
    this.source = null;
    source?.stop();
    if (source) this.releaseSource(source);
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.progress();
  }
  private interrupt() {
    if (this.buffer || this.controller) this.renewContext = true;
    if (!this.source) return;
    this.stop();
    this.interrupted = true;
    this.progress();
  }
  private recover() {
    if (document.hidden || !this.interrupted || this.unlocking > 0) return;
    if (this.onRecover) {
      this.onRecover();
      return;
    }
    void this.resume().catch(() => this.progress());
  }
  private releaseSource(source: AudioBufferSourceNode) {
    source.onended = null;
    source.disconnect();
    source.buffer = null;
    diagnostic('audio.source.released');
  }
  async dispose() {
    document.removeEventListener('visibilitychange', this.visibilityChanged);
    window.removeEventListener('pagehide', this.pageHidden);
    window.removeEventListener('pageshow', this.pageShown);
    this.context.removeEventListener('statechange', this.contextChanged);
    this.clear();
    await this.context.close();
  }
}
