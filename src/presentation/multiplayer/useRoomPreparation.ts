import { AudioLoadError } from '../../infrastructure/audio/audioLoadError.js';
import { RetryBudget } from '../../domain/network/retry.js';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { GameAudio } from '../../infrastructure/audio/gameAudio.js';
import { errorMessage } from '../shared/errorMessage.js';

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
  const [failure, setFailure] = useState(false);
  const failures = useRef({ url, round, budget: new RetryBudget(3, 5000) });
  const reset = useCallback(() => setPrepared(null), []);
  const retry = useCallback(() => {
    if (!failed.current) return false;
    failed.current = false;
    failures.current.budget.reset();
    setAttempt((value) => value + 1);
    return true;
  }, []);
  useEffect(() => {
    if (!url || !connected) {
      if (connected && !url) audio.current?.clear();
      else audio.current?.cancelPreparation();
      return;
    }
    if (failures.current.url !== url || failures.current.round !== round)
      failures.current = { url, round, budget: new RetryBudget(3, 5000) };
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    failed.current = false;
    setFailure(false);
    void audio.current
      ?.prepare(url)
      .then((ready) => {
        if (controller.signal.aborted) return;
        if (!ready) throw new Error('音声の準備が中断されました。再生ボタンを押してください');
        if (!controller.signal.aborted) {
          failures.current.budget.reset();
          setPrepared({ url, round, attempt });
          setError('');
        }
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        failed.current = true;
        setFailure(true);
        setError(errorMessage(reason, '音声を準備できません'));
        const delay = failures.current.budget.next(
          reason instanceof AudioLoadError && reason.retryable,
        );
        if (delay !== null) {
          const minimum = reason instanceof AudioLoadError ? (reason.retryAfterMs ?? 0) : 0;
          timer = setTimeout(() => setAttempt((value) => value + 1), Math.max(delay, minimum));
        }
      });
    return () => {
      controller.abort();
      clearTimeout(timer);
      audio.current?.cancelPreparation();
    };
  }, [audio, connected, url, round, attempt, setError]);
  return {
    failed: failure,
    ready:
      connected &&
      prepared?.url === url &&
      prepared?.round === round &&
      prepared?.attempt === attempt,
    reset,
    retry,
  };
}
