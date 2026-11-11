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
