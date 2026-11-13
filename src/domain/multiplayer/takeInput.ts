export interface PendingTake {
  readonly round: number;
  readonly id: string;
  readonly accepted: boolean;
}

export class TakeInput {
  private pending: PendingTake | null = null;
  constructor(private readonly changed: (pending: PendingTake | null) => void) {}
  locked(round: number): boolean {
    return this.pending?.round === round;
  }
  submit(round: number, id: string, transmit: () => boolean): boolean {
    if (this.locked(round) || !transmit()) return false;
    this.pending = { round, id, accepted: false };
    this.changed(this.pending);
    return true;
  }
  accept(round: number): boolean {
    if (!this.pending || this.pending.round !== round || this.pending.accepted) return false;
    this.pending = { ...this.pending, accepted: true };
    this.changed(this.pending);
    return true;
  }
  reject(round: number): boolean {
    if (!this.locked(round)) return false;
    this.reset();
    return true;
  }
  reset() {
    if (!this.pending) return;
    this.pending = null;
    this.changed(null);
  }
}
