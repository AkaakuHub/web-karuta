export function outputContextTime(timestamp: AudioTimestamp, performanceTime: number): number {
  if (
    typeof timestamp.contextTime !== 'number' ||
    typeof timestamp.performanceTime !== 'number' ||
    !Number.isFinite(timestamp.contextTime) ||
    !Number.isFinite(timestamp.performanceTime) ||
    timestamp.performanceTime <= 0
  )
    throw new Error('音声出力の時刻を測定できません');
  return timestamp.contextTime + (performanceTime - timestamp.performanceTime) / 1000;
}

export async function waitForAudioOutput(
  context: AudioContext,
  signal: AbortSignal,
): Promise<boolean> {
  const until = performance.now() + 1000;
  while (!signal.aborted && context.state === 'running') {
    const output = context.getOutputTimestamp().performanceTime;
    if (typeof output === 'number' && output > 0) return true;
    if (performance.now() >= until) throw new Error('音声出力の準備が完了しません');
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
  }
  return false;
}

export function audioOutputAdvancing(
  output: AudioTimestamp,
  startedAt: number,
  now: number,
): boolean {
  return (
    typeof output.contextTime === 'number' &&
    Number.isFinite(output.contextTime) &&
    output.contextTime > startedAt &&
    typeof output.performanceTime === 'number' &&
    Number.isFinite(output.performanceTime) &&
    now - output.performanceTime <= 250
  );
}

export class AudioOutputMonitor {
  private time: number | undefined;
  private advancedAt = 0;
  check(output: AudioTimestamp, now: number): boolean {
    if (output.contextTime !== this.time) {
      this.time = output.contextTime ?? 0;
      this.advancedAt = now;
    }
    return now - this.advancedAt <= 500;
  }
}
