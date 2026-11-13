import { retryAfter } from '../../domain/network/retry.js';
import { AudioLoadError } from './audioLoadError.js';

export async function fetchAudio(url: string, signal: AbortSignal): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const combined = AbortSignal.any([signal, controller.signal]);
  const abort = () =>
    controller.abort(new AudioLoadError('音声の通信が30秒以上停止しました', true));
  let timer = setTimeout(abort, 30000);
  const resetTimeout = () => {
    clearTimeout(timer);
    timer = setTimeout(abort, 30000);
  };
  try {
    const response = await fetch(url, { signal: combined });
    if (!response.ok) {
      const detail = await response.text();
      throw new AudioLoadError(
        `音声を取得できません：HTTP ${response.status} ${url}\n${detail}`,
        response.status >= 500 || [408, 429].includes(response.status),
        { retryAfterMs: retryAfter(response.headers.get('Retry-After')) },
      );
    }
    if (!response.body) throw new Error('音声の内容がありません');
    const reader = response.body.getReader();
    const cancel = () => {
      void reader.cancel(combined.reason).catch(() => {});
    };
    combined.addEventListener('abort', cancel, { once: true });
    try {
      const chunks: Uint8Array[] = [];
      let length = 0;
      while (true) {
        combined.throwIfAborted();
        const { done, value } = await reader.read();
        combined.throwIfAborted();
        if (done) break;
        chunks.push(value);
        length += value.length;
        resetTimeout();
      }
      const bytes = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      return bytes.buffer;
    } finally {
      combined.removeEventListener('abort', cancel);
      reader.releaseLock();
    }
  } catch (error) {
    if (combined.aborted) throw combined.reason;
    if (error instanceof AudioLoadError) throw error;
    throw new AudioLoadError('音声の通信が途切れました', true, { cause: error });
  } finally {
    clearTimeout(timer);
  }
}
