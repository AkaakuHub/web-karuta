import { AudioVolumeProvider } from '../audio/useAudioVolume.js';
import { GameSettingsProvider } from '../game/useGameSettings.js';
import { ToastProvider } from '../shared/toastProvider.js';
import { RoomExitGuard } from '../multiplayer/roomExitGuard.js';
import { createContext, useContext, type ReactNode } from 'react';

export interface KarutaConfig {
  storagePrefix: string;
  clientVersion?: string;
  request: (path: string, init?: RequestInit) => Promise<unknown>;
}
const Config = createContext<KarutaConfig | null>(null);
export function KarutaProvider({ value, children }: { value: KarutaConfig; children: ReactNode }) {
  return (
    <Config value={value}>
      <ToastProvider>
        <AudioVolumeProvider>
          <GameSettingsProvider>
            <RoomExitGuard>{children}</RoomExitGuard>
          </GameSettingsProvider>
        </AudioVolumeProvider>
      </ToastProvider>
    </Config>
  );
}
export function useKarutaConfig(): KarutaConfig {
  const config = useContext(Config);
  if (!config) throw new Error('KarutaProviderがありません');
  return config;
}
