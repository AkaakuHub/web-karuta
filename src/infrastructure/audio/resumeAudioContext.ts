import { diagnostic } from '../diagnostics/diagnostics.js';

export async function resumeAudioContext(context: AudioContext, verifyClock: boolean) {
  let active = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const startedAt = context.currentTime;
  diagnostic('audio.context.resume', { state: context.state, contextTime: startedAt, verifyClock });
  const resume = async () => {
    const resumed = context.resume();
    if (
      context.state !== 'running' ||
      verifyClock ||
      !context.getOutputTimestamp().performanceTime
    ) {
      const source = context.createBufferSource();
      source.buffer = context.createBuffer(1, 1, context.sampleRate);
      source.connect(context.destination);
      source.onended = () => {
        source.disconnect();
        source.buffer = null;
      };
      source.start();
    }
    await resumed;
    if (!active) return;
    if (context.state !== 'running') throw new Error('音声が中断されています');
    while (active && verifyClock && context.currentTime <= startedAt) {
      await new Promise<void>((resolve) => setTimeout(resolve, 25));
    }
    if (active && context.state !== 'running') throw new Error('音声が中断されています');
  };
  try {
    await Promise.race([
      resume(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('音声を再開できません。再生ボタンを押してください')),
          2000,
        );
      }),
    ]);
    diagnostic('audio.context.resumed', { state: context.state, contextTime: context.currentTime });
  } catch (reason) {
    diagnostic('audio.context.resume.failed', {
      state: context.state,
      contextTime: context.currentTime,
    });
    throw reason;
  } finally {
    active = false;
    clearTimeout(timer);
  }
}
