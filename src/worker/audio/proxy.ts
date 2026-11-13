export async function streamAudio(
  url: string,
  request: Pick<Request, 'headers'>,
  requestHeaders: (url: string, range: string | null) => HeadersInit,
): Promise<Response> {
  const range = request.headers.get('Range');
  if (range && !/^bytes=\d+-\d*$/u.test(range)) return new Response(null, { status: 416 });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  let upstream: Response;
  try {
    upstream = await fetch(url, {
      headers: requestHeaders(url, range),
      signal: controller.signal,
      redirect: 'follow',
    });
  } finally {
    clearTimeout(timer);
  }
  if (!upstream.ok) {
    await upstream.body?.cancel();
    const headers = new Headers({ 'Cache-Control': 'no-store' });
    const retryAfter = upstream.headers.get('Retry-After');
    if (retryAfter) headers.set('Retry-After', retryAfter);
    return Response.json(
      { error: `音源の掲載元：HTTP ${upstream.status}` },
      {
        status: upstream.status >= 400 ? upstream.status : 502,
        headers,
      },
    );
  }
  const headers = new Headers({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  for (const name of ['Content-Type', 'Content-Range', 'Accept-Ranges']) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (!upstream.headers.has('Content-Encoding')) {
    const length = upstream.headers.get('Content-Length');
    if (length) headers.set('Content-Length', length);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}
