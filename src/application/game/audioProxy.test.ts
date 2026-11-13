import { afterEach, expect, it, vi } from 'vite-plus/test';
import { streamAudio } from '../../worker/audio/proxy.js';
afterEach(() => vi.unstubAllGlobals());

it.each([403, 404, 429, 503])(
  '音源のHTTP %iを一律502に変換せず再試行可否を保つ',
  async (status) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('upstream failure', {
          status,
          headers: { 'Retry-After': '25' },
        }),
      ),
    );
    const response = await streamAudio(
      'https://example.test/audio',
      new Request('https://app.test/audio'),
      () => ({}),
    );
    expect(response.status).toBe(status);
    expect(response.headers.get('Retry-After')).toBe('25');
  },
);
it('不正な再生範囲では音源の掲載元へ通信しない', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const response = await streamAudio(
    'https://example.test/audio',
    new Request('https://app.test/audio', {
      headers: { Range: 'bytes=0-100,200-300' },
    }),
    () => ({}),
  );
  expect(response.status).toBe(416);
  expect(fetch).not.toHaveBeenCalled();
});
