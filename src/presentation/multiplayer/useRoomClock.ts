import { useCallback, useEffect, useRef, useState } from 'react';

export function useRoomClock(startsAt: number | null) {
  const [latency, setLatency] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [revision, setRevision] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const offset = useRef(0);
  const bestRtt = useRef(Infinity);
  const latestRtt = useRef(0);
  const pending = useRef(true);
  const read = useCallback(() => Date.now() + offset.current, []);
  const rtt = useCallback(() => latestRtt.current, []);
  const reset = useCallback(() => {
    bestRtt.current = Infinity;
    pending.current = true;
    setReady(false);
  }, []);
  const receive = useCallback((message: { sent: number; now: number }) => {
    const received = Date.now();
    const elapsed = Math.max(0, received - message.sent);
    latestRtt.current = Math.min(10000, elapsed);
    setLatency(elapsed);
    if (elapsed < bestRtt.current) {
      bestRtt.current = elapsed;
      offset.current = message.now - (message.sent + received) / 2;
    }
    setNow(received + offset.current);
    setReady(true);
    if (pending.current) {
      pending.current = false;
      setRevision((revision) => revision + 1);
    }
  }, []);
  useEffect(() => {
    if (startsAt === null) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const time = read();
      setNow(time);
      if (time < startsAt) timer = setTimeout(tick, Math.min(100, startsAt - time));
    };
    timer = setTimeout(tick, 0);
    return () => clearTimeout(timer);
  }, [startsAt, read]);
  return { latency, now, ready, revision, read, rtt, reset, receive };
}
