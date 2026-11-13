import { afterEach, expect, it, vi } from 'vite-plus/test';
import { buffer, setup, resetAudioHarness } from './audioHarness.js';

afterEach(resetAudioHarness);

it('別アプリへの移動中は位置を保持し、戻ると再取得せず停止位置から再開する', async () => {
  const { audio, context, contexts, page, report } = setup();
  try {
    audio.volume(0.23);
    await audio.play('/track/one');
    const original = context.sources[0]!.buffer;
    const normalization = context.gains[1]!.gain.value;
    context.currentTime = 0.04;
    page.hidden = true;
    page.dispatchEvent(new Event('visibilitychange'));
    expect(report).toHaveBeenLastCalledWith({ position: 0.04, duration: 0.1 }, false, true);
    context.currentTime = 10;
    page.hidden = false;
    page.dispatchEvent(new Event('visibilitychange'));
    await vi.waitFor(() => expect(contexts.at(-1)!.sources).toHaveLength(1));
    expect(context.state).toBe('closed');
    expect(contexts.at(-1)!.sources[0]!.offset).toBeCloseTo(0.04);
    expect(contexts.at(-1)!.sources[0]!.buffer).toBe(original);
    expect(contexts.at(-1)!.gains.map((gain) => gain.gain.value)).toEqual([0.23, normalization]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenLastCalledWith({ position: 0.04, duration: 0.1 }, true, false);
  } finally {
    await audio.dispose();
  }
});

it('runningでも時計が止まっていれば再生済みとせず、次の操作で音源を再利用して復帰する', async () => {
  vi.useFakeTimers();
  const { audio, context, contexts, contextType, page, report } = setup();
  try {
    await audio.play('/track/one');
    const original = context.sources[0]!.buffer;
    context.currentTime = 0.03;
    page.hidden = true;
    page.dispatchEvent(new Event('visibilitychange'));
    contextType.clockFrozen = true;
    page.hidden = false;
    page.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(2000);
    expect(contexts.at(-1)!.state).toBe('running');
    expect(contexts.at(-1)!.currentTime).toBe(0);
    expect(contexts.at(-1)!.sources).toHaveLength(0);
    expect(report).toHaveBeenLastCalledWith({ position: 0.03, duration: 0.1 }, false, true);
    contextType.clockFrozen = false;
    const resumed = audio.resume();
    await vi.advanceTimersByTimeAsync(50);
    await resumed;
    expect(contexts.at(-1)!.currentTime).toBeGreaterThan(0);
    expect(contexts.at(-1)!.sources[0]!.offset).toBeCloseTo(0.03);
    expect(contexts.at(-1)!.sources[0]!.buffer).toBe(original);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenLastCalledWith({ position: 0.03, duration: 0.1 }, true, false);
  } finally {
    await audio.dispose();
  }
});

it('自分で停止した音声は画面に戻っても自動再開しない', async () => {
  const { audio, context, page } = setup();
  try {
    await audio.play('/track/one');
    audio.stop();
    page.hidden = true;
    page.dispatchEvent(new Event('visibilitychange'));
    page.hidden = false;
    page.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    expect(context.sources).toHaveLength(1);
  } finally {
    await audio.dispose();
  }
});

it('対戦中はタブ移動だけで再生を停止しない', async () => {
  const recover = vi.fn();
  const { audio, context, page } = setup(recover);
  try {
    await audio.play('/track/one');
    page.hidden = true;
    page.dispatchEvent(new Event('visibilitychange'));
    page.hidden = false;
    page.dispatchEvent(new Event('visibilitychange'));
    expect(recover).not.toHaveBeenCalled();
    expect(context.sources).toHaveLength(1);
  } finally {
    await audio.dispose();
  }
});

it('次の曲の開始が中断された場合に前の曲のバッファを再開しない', async () => {
  const { audio, context, contexts, contextType, report } = setup();
  try {
    await audio.play('/track/old');
    context.state = 'interrupted';
    context.dispatchEvent(new Event('statechange'));
    const resume = vi
      .spyOn(contextType.prototype, 'resume')
      .mockRejectedValue(new Error('NotAllowedError'));
    await expect(audio.play('/track/new')).rejects.toThrow();
    expect(report).toHaveBeenLastCalledWith({ position: 0, duration: 0 }, false, true);
    resume.mockRestore();
    window.dispatchEvent(new Event('pageshow'));
    await Promise.resolve();
    expect(context.sources).toHaveLength(1);
    await audio.play('/track/new');
    expect(contexts.flatMap((context) => context.sources)).toHaveLength(2);
    expect(fetch).toHaveBeenCalledTimes(2);
  } finally {
    await audio.dispose();
  }
});

it('対戦の開始前にSafariが中断しても再生操作を残す', async () => {
  const { audio, context, contexts, contextType, report } = setup();
  try {
    await audio.prepare('/track/one');
    context.state = 'interrupted';
    const resume = vi
      .spyOn(contextType.prototype, 'resume')
      .mockRejectedValue(new Error('NotAllowedError'));
    await expect(audio.schedule(0, () => 0, new AbortController().signal)).rejects.toThrow();
    expect(report).toHaveBeenLastCalledWith({ position: 0, duration: 0.1 }, false, true);
    resume.mockRestore();
    await audio.resume();
    expect(contexts.at(-1)!.sources).toHaveLength(1);
  } finally {
    await audio.dispose();
  }
});

it('読み込み中の中断でも展開済み音源を保持し、画面に戻ると再取得せず再開する', async () => {
  const { audio, context, contexts, contextType, report } = setup();
  try {
    context.decode = async () => {
      context.state = 'interrupted';
      return buffer();
    };
    const resume = vi
      .spyOn(contextType.prototype, 'resume')
      .mockImplementationOnce(async () => {
        context.state = 'running';
      })
      .mockRejectedValueOnce(new Error('NotAllowedError'));
    await expect(audio.play('/track/one')).rejects.toThrow();
    expect(report).toHaveBeenLastCalledWith({ position: 0, duration: 0.1 }, false, true);
    resume.mockRestore();
    window.dispatchEvent(new Event('pageshow'));
    await vi.waitFor(() => expect(contexts.at(-1)!.sources).toHaveLength(1));
    expect(fetch).toHaveBeenCalledTimes(1);
  } finally {
    await audio.dispose();
  }
});

it('Safariの中断から自動再開できなくても再開操作を残し、1回の操作で復帰する', async () => {
  const { audio, context, contexts, contextType, report } = setup();
  try {
    await audio.play('/track/one');
    context.currentTime = 0.03;
    context.state = 'interrupted';
    context.dispatchEvent(new Event('statechange'));
    const resume = vi
      .spyOn(contextType.prototype, 'resume')
      .mockRejectedValue(new Error('NotAllowedError'));
    window.dispatchEvent(new Event('pageshow'));
    await vi.waitFor(() => expect(resume).toHaveBeenCalledTimes(1));
    expect(report).toHaveBeenLastCalledWith({ position: 0.03, duration: 0.1 }, false, true);
    resume.mockRestore();
    await audio.resume();
    expect(contexts.at(-1)!.sources[0]!.offset).toBeCloseTo(0.03);
    expect(report).toHaveBeenLastCalledWith({ position: 0.03, duration: 0.1 }, true, false);
  } finally {
    await audio.dispose();
  }
});

it('再開が未完了でも2秒で操作を返し、終了後に遅れて音声を再開しない', async () => {
  vi.useFakeTimers();
  const { audio, context, contextType } = setup();
  try {
    await audio.play('/track/one');
    context.state = 'interrupted';
    context.dispatchEvent(new Event('statechange'));
    let finish: () => void = () => {};
    vi.spyOn(contextType.prototype, 'resume').mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const resumed = expect(audio.resume()).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(2000);
    await resumed;
    audio.clear();
    finish();
    await Promise.resolve();
    expect(context.sources).toHaveLength(1);
  } finally {
    await audio.dispose();
  }
});

it('100曲を切り替えても、過去の再生ノードが音声バッファと終了通知を保持しない', async () => {
  const { audio, context } = setup();
  try {
    for (let index = 0; index < 100; index++) await audio.play(`/track/${index}`);
    expect(context.sources.filter((source) => source.buffer !== null)).toHaveLength(1);
    expect(
      context.sources.slice(0, -1).every((source) => source.onended === null && !source.connected),
    ).toBe(true);
    audio.clear();
    expect(
      context.sources.every((source) => source.buffer === null && source.onended === null),
    ).toBe(true);
  } finally {
    await audio.dispose();
  }
});

it('自然終了したノードを解放しても、同じ音声を再取得せずに再生し直せる', async () => {
  const { audio, context } = setup();
  try {
    await audio.play('/track/one');
    const original = context.sources[0]!.buffer;
    context.sources[0]!.finish();
    expect(context.sources[0]!.buffer).toBeNull();
    await audio.resume();
    expect(context.sources[1]!.buffer).toBe(original);
    expect(fetch).toHaveBeenCalledTimes(1);
  } finally {
    await audio.dispose();
  }
});

it('中止した音声の展開が終わるまで次の展開を重ねず、古い結果を再生しない', async () => {
  const { audio, context } = setup();
  let finish: (value: AudioBuffer) => void = () => {
    throw new Error('展開が開始していません');
  };
  let notifyStarted: () => void = () => {};
  const started = new Promise<void>((resolve) => {
    notifyStarted = resolve;
  });
  const decode = vi
    .fn<(data: ArrayBuffer) => Promise<AudioBuffer>>()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
          notifyStarted();
        }),
    )
    .mockImplementation(async () => buffer());
  context.decode = decode;
  try {
    const first = audio.prepare('/track/old');
    await started;
    const second = audio.prepare('/track/new');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(decode).toHaveBeenCalledTimes(1);
    finish(buffer());
    expect(await first).toBe(false);
    expect(await second).toBe(true);
    expect(decode).toHaveBeenCalledTimes(2);
    await audio.resume();
    expect(context.sources).toHaveLength(1);
  } finally {
    await audio.dispose();
  }
});

it('参加操作と同じ呼び出しで無音出力を開始し、音声取得前に出力を初期化する', async () => {
  const { audio, context } = setup();
  try {
    const playing = audio.play('/track/one');
    expect(context.primingSources).toHaveLength(1);
    expect(fetch).not.toHaveBeenCalled();
    await playing;
    expect(context.sources).toHaveLength(1);
    expect(
      context.primingSources.every(
        (source) => source.buffer === null && source.onended === null && !source.connected,
      ),
    ).toBe(true);
  } finally {
    await audio.dispose();
  }
});
