export class AudioDecodeQueue {
  private pending = Promise.resolve();
  constructor(private readonly decode: (data: ArrayBuffer) => Promise<AudioBuffer>) {}

  run(data: ArrayBuffer, signal: AbortSignal): Promise<AudioBuffer | null> {
    const result = this.pending.then(async () => {
      if (signal.aborted) return null;
      const buffer = await this.decode(data);
      return signal.aborted ? null : buffer;
    });
    this.pending = result.then(
      () => {},
      () => {},
    );
    return result;
  }
}
