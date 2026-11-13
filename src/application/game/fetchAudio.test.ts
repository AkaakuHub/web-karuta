import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test';
import { AudioLoadError } from '../../infrastructure/audio/audioLoadError.js';
import { fetchAudio } from '../../infrastructure/audio/fetchAudio.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('3G相当の遅い転送でも、通信が続けば60秒を超えて取得できる', async () => {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let index = 1; index <= 4; index++)
        setTimeout(() => {
          controller.enqueue(new Uint8Array([index]));
          if (index === 4) controller.close();
        }, index * 20000);
    },
  });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body)));
  const result = fetchAudio('/slow-audio', new AbortController().signal);
  await vi.advanceTimersByTimeAsync(80000);
  expect(new Uint8Array(await result)).toEqual(new Uint8Array([1, 2, 3, 4]));
  expect(vi.getTimerCount()).toBe(0);
});

it('30秒間データが来なければ取得を中止する', async () => {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    cancel() {
      cancelled = true;
    },
  });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body)));
  const result = fetchAudio('/stalled-audio', new AbortController().signal);
  const rejected = expect(result).rejects.toThrow('音声の通信が30秒以上停止しました');
  await vi.advanceTimersByTimeAsync(30000);
  await rejected;
  expect(cancelled).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});

it('曲送りや切断によるキャンセルで、古い音声の取得を終了する', async () => {
  const controller = new AbortController();
  const body = new ReadableStream<Uint8Array>();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body)));
  const result = fetchAudio('/old-round', controller.signal);
  const rejected = expect(result).rejects.toMatchObject({ name: 'AbortError' });
  await vi.advanceTimersByTimeAsync(0);
  controller.abort();
  await rejected;
  expect(vi.getTimerCount()).toBe(0);
});

it.each([
  { status: 404, retryable: false },
  { status: 403, retryable: false },
  { status: 429, retryable: true },
  { status: 503, retryable: true },
])('HTTP $statusの再試行可否を保持する', async ({ status, retryable }) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response('failed', { status, headers: { 'Retry-After': '15' } })),
  );
  try {
    await fetchAudio('/failed', new AbortController().signal);
    throw new Error('失敗を返しませんでした');
  } catch (error) {
    expect(error).toBeInstanceOf(AudioLoadError);
    if (!(error instanceof AudioLoadError)) throw error;
    expect(error.retryable).toBe(retryable);
    expect(error.retryAfterMs).toBe(15000);
  }
});
