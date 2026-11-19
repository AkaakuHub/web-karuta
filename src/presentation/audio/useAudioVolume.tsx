import { useKarutaConfig } from '../config/karutaProvider.js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { z } from 'zod';

const preferenceSchema = z.object({
  volume: z.number().min(0).max(1),
  muted: z.boolean(),
  previous: z.number().positive().max(1),
});

function useVolumePreference() {
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
  function saveVolume(volume: number, muted: boolean) {
    setPreference((current) => ({
      volume: !muted && volume === 0 ? current.previous : volume,
      muted,
      previous: volume > 0 ? volume : current.previous,
    }));
  }
  function setVolume(volume: number) {
    saveVolume(volume, volume === 0);
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

const VolumeContext = createContext<ReturnType<typeof useVolumePreference> | null>(null);

export function AudioVolumeProvider({ children }: { children: ReactNode }) {
  const volume = useVolumePreference();
  return <VolumeContext value={volume}>{children}</VolumeContext>;
}

export function useAudioVolume() {
  const volume = useContext(VolumeContext);
  if (!volume) throw new Error('音量設定がありません');
  return volume;
}
