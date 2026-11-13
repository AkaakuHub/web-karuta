import { useEffect, type RefObject } from 'react';
import type { GameAudio } from '../../infrastructure/audio/gameAudio.js';
import { errorMessage } from '../shared/errorMessage.js';

export function useRoomAudioActions(
  audio: RefObject<GameAudio | null>,
  setError: (message: string) => void,
  volume: number,
  retryPreparation: () => boolean,
) {
  useEffect(() => {
    audio.current?.volume(volume);
  }, [audio, volume]);
  return {
    seek: async (position: number) => {
      try {
        await audio.current?.seek(position);
      } catch (reason) {
        setError(errorMessage(reason, '再生位置を変更できません'));
      }
    },
    resume: async () => {
      try {
        const player = audio.current;
        if (!player) return;
        await player.unlock();
        if (!retryPreparation()) await player.resume();
        setError('');
      } catch (reason) {
        setError(errorMessage(reason, '再生できません'));
      }
    },
  };
}
