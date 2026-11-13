export class AudioLoadError extends Error {
  readonly retryAfterMs?: number;
  constructor(
    message: string,
    readonly retryable: boolean,
    options?: ErrorOptions & { retryAfterMs?: number },
  ) {
    super(message, options);
    this.name = 'AudioLoadError';
    this.retryAfterMs = options?.retryAfterMs;
  }
}
