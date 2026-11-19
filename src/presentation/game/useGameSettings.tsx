import { useKarutaConfig } from '../config/karutaProvider.js';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { z } from 'zod';

export const gameSettingsSchema = z.object({
  autoNext: z.boolean(),
  delaySeconds: z.number().int().min(0).max(300),
});

export type GameSettings = z.output<typeof gameSettingsSchema>;
const defaults: GameSettings = { autoNext: true, delaySeconds: 1 };
const SettingsContext = createContext<{
  value: GameSettings;
  save: (value: GameSettings) => void;
} | null>(null);

export function GameSettingsProvider({ children }: { children: ReactNode }) {
  const { storagePrefix } = useKarutaConfig();
  const key = `${storagePrefix}-game-settings`;
  const [value, setValue] = useState(() => {
    const raw = localStorage.getItem(key);
    return raw === null ? defaults : gameSettingsSchema.parse(JSON.parse(raw));
  });
  function save(next: GameSettings) {
    localStorage.setItem(key, JSON.stringify(next));
    setValue(next);
  }
  return <SettingsContext value={{ value, save }}>{children}</SettingsContext>;
}

export function useGameSettings() {
  const state = useContext(SettingsContext);
  if (!state) throw new Error('ゲーム設定がありません');
  return state;
}
