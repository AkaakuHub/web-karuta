import { createAudioOutput } from './audioOutput.js';
import { decodeAudio } from './decodeAudio.js';
import { audibleReactionMs } from '../../domain/game/audioTiming.js';
import {
  AudioOutputMonitor,
  audioOutputAdvancing,
  outputContextTime,
  waitForAudioOutput,
} from './outputClock.js';
import type { TrackProgress } from './audioProgress.js';
import { playbackPosition } from '../../domain/game/playback.js';
import { AudioPreparation } from './audioPreparation.js';
import { diagnostic } from '../diagnostics/diagnostics.js';
import { resumeAudioContext } from './resumeAudioContext.js';

export class GameAudio {
  private output: ReturnType<GameAudio['createOutput']> | null = null;
  private level = 0.7;
  private preparation = new AudioPreparation((data) => decodeAudio(this.context, data));
  private generation = 0;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private offset = 0;
  private startedAt: number | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private interrupted = false;
  private renewContext = false;
  private verifyClock = false;
  private unlocking = 0;
  private unlockAttempt = 0;
  private playbackRevision = 0;
  private recoveryPending = false;
  private outputStartedAt = 0;
  private outputMonitor = new AudioOutputMonitor();
  private scheduled: (() => Promise<void>) | null = null;
  private readonly visibilityChanged = () => {
    if (document.hidden) {
      if (!this.onRecover) this.interrupt();
    } else this.recover();
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
    document.addEventListener('visibilitychange', this.visibilityChanged);
    window.addEventListener('pagehide', this.pageHidden);
    window.addEventListener('pageshow', this.pageShown);
  }
  private createOutput(normalizationLevel: number) {
    const output = createAudioOutput(this.level, normalizationLevel);
    output.context.addEventListener('statechange', this.contextChanged);
    return output;
  }
  private get context() {
    return (this.output ??= this.createOutput(1)).context;
  }
  private get position() {
    return playbackPosition(
      this.offset,
      this.startedAt,
      this.output?.context.currentTime ?? 0,
      this.buffer?.duration ?? 0,
    );
  }
  private progress() {
    if (
      this.source &&
      !this.outputMonitor.check(this.context.getOutputTimestamp(), performance.now())
    ) {
      this.interrupt();
      this.recover();
      return;
    }
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
    const previous = this.output;
    if (!previous) return;
    previous.context.removeEventListener('statechange', this.contextChanged);
    previous.normalization.disconnect();
    previous.gain.disconnect();
    void previous.context.close().catch(() => diagnostic('audio.context.close.failed'));
    this.output = this.createOutput(previous.normalization.gain.value);
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
      this.start(0, 0);
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
    this.scheduled = null;
    this.generation++;
    this.preparation.clear();
    this.stop();
    this.buffer = null;
    this.offset = 0;
    this.progress();
  }
  cancelPreparation() {
    this.scheduled = null;
    this.preparation.cancel();
    this.stop();
  }
  async prepare(url: string): Promise<boolean> {
    this.scheduled = null;
    this.stop();
    this.offset = 0;
    this.buffer = null;
    this.progress();
    const prepared = await this.preparation.load(url);
    if (!prepared) return false;
    const output = this.output;
    if (!output) return false;
    output.normalization.gain.value = prepared.normalization;
    this.buffer = prepared.buffer;
    this.progress();
    if (!(await this.unlock()) || !(await waitForAudioOutput(this.context, prepared.signal)))
      return false;
    return !prepared.signal.aborted;
  }
  private start(delay: number, position: number) {
    this.stop();
    const output = this.output;
    if (!output || !this.buffer || position >= this.buffer.duration) return;
    if (document.hidden && !this.onRecover) {
      this.offset = position;
      this.interrupted = true;
      this.progress();
      return;
    }
    const source = this.context.createBufferSource();
    source.buffer = this.buffer;
    source.connect(output.normalization);
    this.offset = position;
    this.startedAt = this.context.currentTime + delay;
    this.outputMonitor = new AudioOutputMonitor();
    this.source = source;
    this.recoveryPending = false;
    this.outputStartedAt =
      this.context.getOutputTimestamp().contextTime ?? this.context.currentTime;
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
    source.start(delay === 0 ? 0 : this.startedAt, position);
    this.timer = setInterval(() => this.progress(), 200);
    this.progress();
  }
  async schedule(startsAt: number, serverNow: () => number, signal: AbortSignal) {
    this.scheduled = () => this.schedule(startsAt, serverNow, new AbortController().signal);
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
    const targetTime = performance.now() + startsAt - serverNow();
    const delay =
      outputContextTime(this.context.getOutputTimestamp(), targetTime) - this.context.currentTime;
    this.start(Math.max(0, delay), Math.max(0, -delay));
  }
  reactionTime(at: number): number {
    const output = this.context.getOutputTimestamp();
    if (
      this.context.state !== 'running' ||
      !audioOutputAdvancing(output, this.outputStartedAt, performance.now()) ||
      this.startedAt === null ||
      !this.source ||
      this.interrupted
    )
      throw new Error('音声の再生を確認してください');
    return audibleReactionMs(outputContextTime(output, at), this.startedAt, this.offset);
  }
  async seek(position: number) {
    this.scheduled = null;
    if (!this.buffer || !Number.isFinite(position)) return;
    const revision = this.playbackRevision;
    if (!(await this.unlock())) return;
    if (revision !== this.playbackRevision) return;
    this.start(0, Math.min(this.buffer.duration, Math.max(0, position)));
  }
  async resume() {
    if (!this.buffer) return;
    if (this.scheduled) return this.scheduled();
    if (this.source) {
      await this.unlock();
      this.progress();
      return;
    }
    await this.seek(this.position >= this.buffer.duration ? 0 : this.position);
  }
  volume(value: number) {
    this.level = value;
    if (this.output) this.output.gain.gain.value = value;
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
    if (this.buffer || this.preparation.active) this.renewContext = true;
    if (!this.source) return;
    this.stop();
    this.interrupted = true;
    this.progress();
  }
  private recover() {
    if (document.hidden || !this.interrupted || this.unlocking > 0) return;
    if (this.onRecover) {
      if (this.recoveryPending) return;
      this.recoveryPending = true;
      this.onRecover();
      return;
    }
    void this.resume().catch(() => this.progress());
  }
  private releaseSource(source: AudioBufferSourceNode) {
    source.onended = null;
    source.disconnect();
    source.buffer = null;
  }
  async dispose() {
    document.removeEventListener('visibilitychange', this.visibilityChanged);
    window.removeEventListener('pagehide', this.pageHidden);
    window.removeEventListener('pageshow', this.pageShown);
    const context = this.output?.context;
    context?.removeEventListener('statechange', this.contextChanged);
    this.clear();
    await context?.close();
  }
}
