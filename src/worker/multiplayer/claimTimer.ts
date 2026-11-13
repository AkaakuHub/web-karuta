export class ClaimTimer {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private deadline: number | null = null;
  constructor(private readonly settle: () => Promise<void>) {}
  schedule(deadline: number | null) {
    if (this.deadline === deadline) return;
    if (this.timer !== null) clearTimeout(this.timer);
    this.deadline = deadline;
    this.timer =
      deadline === null
        ? null
        : setTimeout(
            () => {
              if (this.deadline !== deadline) return;
              this.timer = null;
              this.deadline = null;
              void this.settle();
            },
            Math.max(0, deadline - Date.now()),
          );
  }
}
