import { errorMessage } from '../shared/errorMessage.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GameSound } from '../../infrastructure/audio/gameSound.js';
import type { GameFeedback } from '../../domain/game/session.js';

export function useGameFeedback(volume: number, onError: (message: string) => void) {
  const [event, setEvent] = useState<{ feedback: GameFeedback | null; revision: number }>({
    feedback: null,
    revision: 0,
  });
  const sound = useRef<GameSound | null>(null);
  const currentVolume = useRef(volume);
  useEffect(() => {
    currentVolume.current = volume;
  }, [volume]);
  useEffect(() => {
    const player = new GameSound();
    sound.current = player;
    return () => {
      void player.dispose();
    };
  }, []);
  const notify = useCallback(
    (
      kind: GameFeedback['kind'],
      time: number | null = null,
      claimant?: Pick<GameFeedback, 'winner' | 'opponent'>,
    ) => {
      setEvent((current) => ({
        revision: current.revision + 1,
        feedback: { id: current.revision + 1, kind, time, ...claimant },
      }));
      void sound.current
        ?.play(kind, currentVolume.current)
        .catch((reason: unknown) => onError(errorMessage(reason, '効果音を再生できません')));
    },
    [onError],
  );
  const clear = useCallback(
    (preserveCorrect = false) =>
      setEvent((current) =>
        current.feedback && !(preserveCorrect && current.feedback.kind === 'correct')
          ? { ...current, feedback: null }
          : current,
      ),
    [],
  );
  const unlock = useCallback(async () => {
    await sound.current?.unlock();
  }, []);
  return { feedback: event.feedback, revision: event.revision, notify, clear, unlock };
}
