import type { RefObject } from 'react';
import type { GameAudio } from '../../infrastructure/audio/gameAudio.js';
import { errorMessage } from '../shared/errorMessage.js';

export function useRoomAudioActions(
  audio: RefObject<GameAudio | null>,
  setError: (message: string) => void,
) {
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
        await audio.current?.resume();
        setError('');
      } catch (reason) {
        setError(errorMessage(reason, '再生できません'));
      }
    },
  };
}
