import { useCallback, useRef, useState } from 'react';

export function useRoomClock() {
  const [latency, setLatency] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [revision, setRevision] = useState(0);
  const offset = useRef(0);
  const samples = useRef<{ rtt: number; offset: number }[]>([]);
  const pending = useRef(true);
  const read = useCallback(() => performance.timeOrigin + performance.now() + offset.current, []);
  const reset = useCallback(() => {
    samples.current = [];
    pending.current = true;
    setReady(false);
  }, []);
  const receive = useCallback((message: { sent: number; now: number }) => {
    const received = performance.timeOrigin + performance.now();
    const elapsed = Math.max(0, received - message.sent);
    setLatency(Math.round(elapsed));
    samples.current = [
      ...samples.current,
      { rtt: elapsed, offset: message.now - (message.sent + received) / 2 },
    ].slice(-12);
    offset.current = samples.current.toSorted((a, b) => a.rtt - b.rtt)[0]!.offset;
    if (samples.current.length < 3) return;
    setReady(true);
    if (pending.current) {
      pending.current = false;
      setRevision((revision) => revision + 1);
    }
  }, []);
  const reschedule = useCallback(() => setRevision((value) => value + 1), []);
  return { latency, ready, revision, read, reset, receive, reschedule };
}
