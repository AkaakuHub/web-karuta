import { useEffect, useRef, useState } from 'react';
import { GameAudio } from '../../infrastructure/audio/gameAudio.js';
import type { TrackProgress } from '../../infrastructure/audio/audioProgress.js';
import { useAudioVolume } from './useAudioVolume.js';
import { errorMessage } from '../shared/errorMessage.js';

export function useTrackPlayer(url: string) {
  const player = useRef<GameAudio | null>(null);
  const [progress, setProgress] = useState<TrackProgress>({ position: 0, duration: 0 });
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const volume = useAudioVolume();
  useEffect(() => {
    let active = true;
    const audio = new GameAudio((progress, playing) => {
      if (!active) return;
      setProgress(progress);
      setPlaying(playing);
    });
    player.current = audio;
    return () => {
      active = false;
      player.current = null;
      void audio.dispose();
    };
  }, [url]);
  useEffect(() => {
    player.current?.volume(volume.effectiveVolume);
  }, [url, volume.effectiveVolume]);
  async function play() {
    const audio = player.current;
    if (!audio || !url) return;
    setError('');
    setLoading(true);
    try {
      if (progress.duration > 0) await audio.resume();
      else await audio.play(url);
    } catch (reason) {
      if (player.current === audio) setError(errorMessage(reason, '音源を再生できません'));
    } finally {
      if (player.current === audio) setLoading(false);
    }
  }
  async function seek(position: number) {
    const audio = player.current;
    try {
      await audio?.seek(position);
    } catch (reason) {
      if (player.current === audio) setError(errorMessage(reason, '再生位置を変更できません'));
    }
  }
  return {
    progress,
    playing,
    loading,
    error,
    volume,
    play,
    seek,
    pause: () => player.current?.stop(),
  };
}
