export function retryDelay(attempt: number, baseMs: number, random = Math.random()): number {
  const ceiling = Math.min(60000, baseMs * 2 ** Math.min(attempt, 8));
  return Math.round(ceiling * (0.5 + random / 2));
}

export class RetryBudget {
  private attempts = 0;
  constructor(
    private readonly limit: number,
    private readonly baseMs: number,
  ) {}
  next(retryable: boolean): number | null {
    if (!retryable || this.attempts >= this.limit) return null;
    return retryDelay(this.attempts++, this.baseMs);
  }
  reset() {
    this.attempts = 0;
  }
}

export function retryAfter(value: string | null, now = Date.now()): number | undefined {
  if (value === null) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0 && value.trim() !== '') return seconds * 1000;
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : undefined;
}
