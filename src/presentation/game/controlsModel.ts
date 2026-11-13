import type { TrackProgress } from '../../infrastructure/audio/audioProgress.js';

interface GameControlsState {
  phase: 'ready' | 'playing' | 'revealed' | 'complete';
  round: number;
  total: number;
  winner?: string;
  loading: boolean;
  playing: boolean;
  needsResume: boolean;
  canSeek: boolean;
  progress: TrackProgress;
  volume: number;
  muted: boolean;
  claimed: number;
  board: number;
  reserve: number;
  statistics: readonly {
    name: string;
    value: string | number;
    kind: 'score' | 'correct' | 'incorrect' | 'skipped';
  }[];
}
export interface GameControlsProps {
  state: GameControlsState;
  onPlay: () => void | Promise<void>;
  onPause: () => void;
  onSeek: (position: number) => void | Promise<void>;
  onVolume: (volume: number) => void;
  onToggleMuted: () => void;
  onSettings?: () => void;
  onGiveUp?: () => void;
  givenUp?: boolean;
  onReveal?: () => void;
  onNext?: () => void | Promise<void>;
  onReset: () => void;
  resetLabel: string;
}
