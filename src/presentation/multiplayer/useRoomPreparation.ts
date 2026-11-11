import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { GameAudio } from '../../infrastructure/audio/gameAudio.js';
import { errorMessage } from '../shared/errorMessage.js';

async function afterPaint(signal: AbortSignal) {
  for (let frame = 0; frame < 2 && !signal.aborted; frame++) {
    await new Promise<void>((resolve) => {
      const pending = requestAnimationFrame(() => {
        signal.removeEventListener('abort', cancel);
        resolve();
      });
      const cancel = () => {
        cancelAnimationFrame(pending);
        resolve();
      };
      signal.addEventListener('abort', cancel, { once: true });
    });
  }
}

export function useRoomPreparation(
  audio: RefObject<GameAudio | null>,
  connected: boolean,
  url: string | null,
  round: number,
  setError: (message: string) => void,
) {
  const [attempt, setAttempt] = useState(0);
  const [prepared, setPrepared] = useState<{ url: string; round: number; attempt: number } | null>(
    null,
  );
  const failed = useRef(false);
  const reset = useCallback(() => setPrepared(null), []);
  const retry = useCallback(() => {
    if (failed.current) setAttempt((value) => value + 1);
  }, []);
  useEffect(() => {
    if (!url || !connected) {
      audio.current?.stop();
      return;
    }
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    failed.current = false;
    void audio.current
      ?.prepare(url)
      .then(async (ready) => {
        if (!ready || controller.signal.aborted) return;
        await afterPaint(controller.signal);
        if (!controller.signal.aborted) {
          setPrepared({ url, round, attempt });
          setError('');
        }
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        failed.current = true;
        setError(errorMessage(reason, '音声を準備できません'));
        timer = setTimeout(() => setAttempt((value) => value + 1), 5000);
      });
    return () => {
      controller.abort();
      clearTimeout(timer);
      audio.current?.clear();
    };
  }, [audio, connected, url, round, attempt, setError]);
  return {
    ready:
      connected &&
      prepared?.url === url &&
      prepared?.round === round &&
      prepared?.attempt === attempt,
    reset,
    retry,
  };
}
