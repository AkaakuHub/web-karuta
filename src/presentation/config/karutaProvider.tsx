import { RoomExitGuard } from '../multiplayer/roomExitGuard.js';
import { createContext, useContext, type ReactNode } from 'react';

export interface KarutaConfig {
  storagePrefix: string;
  request: (path: string, init?: RequestInit) => Promise<unknown>;
}
const Config = createContext<KarutaConfig | null>(null);
export function KarutaProvider({ value, children }: { value: KarutaConfig; children: ReactNode }) {
  return (
    <Config value={value}>
      <RoomExitGuard>{children}</RoomExitGuard>
    </Config>
  );
}
export function useKarutaConfig(): KarutaConfig {
  const config = useContext(Config);
  if (!config) throw new Error('KarutaProviderがありません');
  return config;
}
