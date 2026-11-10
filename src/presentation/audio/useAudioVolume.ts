import { useKarutaConfig } from '../config/karutaProvider.js';
import { useEffect, useState } from 'react';
import { z } from 'zod';

const preferenceSchema = z.object({
  volume: z.number().min(0).max(1),
  muted: z.boolean(),
  previous: z.number().positive().max(1),
});

export function useAudioVolume() {
  const { storagePrefix } = useKarutaConfig();
  const key = `${storagePrefix}-volume`;
  const [preference, setPreference] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved === null
      ? { volume: 0.7, muted: false, previous: 0.7 }
      : preferenceSchema.parse(JSON.parse(saved));
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(preference));
  }, [preference, key]);
  function setVolume(volume: number) {
    setPreference((current) => ({
      volume,
      muted: volume === 0,
      previous: volume > 0 ? volume : current.previous,
    }));
  }
  function toggleMuted() {
    setPreference((current) =>
      current.muted
        ? { ...current, volume: current.previous, muted: false }
        : { ...current, muted: true },
    );
  }
  return {
    volume: preference.volume,
    muted: preference.muted,
    effectiveVolume: preference.muted ? 0 : preference.volume,
    setVolume,
    toggleMuted,
  };
}
