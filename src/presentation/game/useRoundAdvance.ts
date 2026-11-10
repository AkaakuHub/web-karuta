import { useCallback, useEffect, useEffectEvent, useRef } from 'react';
import type { TrackProgress } from '../../infrastructure/audio/audioProgress.js';
import type { GameSettings } from './useGameSettings.js';
import { usePageVisible } from '../shared/usePageVisible.js';

export function useRoundAdvance({
  round,
  revealed,
  correct,
  paused,
  progress,
  playing,
  ready,
  settings,
  onNext,
  onReveal,
}: {
  round: number;
  revealed: boolean;
  correct: boolean;
  paused: boolean;
  progress: TrackProgress;
  playing: boolean;
  ready: boolean;
  settings: GameSettings;
  onNext?: () => void | Promise<void>;
  onReveal?: () => void;
}) {
  const visible = usePageVisible();
  const ended =
    ready && !playing && progress.duration > 0 && progress.position >= progress.duration;
  const requested = useRef<number | null>(null);
  const advance = useCallback(() => {
    if (!revealed || !onNext || requested.current === round) return;
    requested.current = round;
    return onNext();
  }, [revealed, round, onNext]);
  const automatic = useEffectEvent(() => {
    if (!document.hidden) void advance();
  });
  const reveal = useEffectEvent(() => onReveal?.());
  const canReveal = visible && !!onNext && !!onReveal && ended && !settings.autoNext && !paused;
  const available = !!onNext;
  useEffect(() => {
    if (canReveal) reveal();
  }, [canReveal, round]);
  useEffect(() => {
    if (!revealed || !ready || !available) requested.current = null;
  }, [revealed, ready, available]);
  const enabled =
    visible && available && ready && revealed && !paused && (settings.autoNext ? correct : ended);
  const delaySeconds = settings.autoNext ? settings.delaySeconds : correct ? 0 : 1.5;
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(automatic, delaySeconds * 1000);
    return () => clearTimeout(timer);
  }, [enabled, round, delaySeconds]);
  return onNext ? advance : undefined;
}
