import { diagnostic } from '../../infrastructure/diagnostics/diagnostics.js';
import { sourceForRound } from '../../domain/game/audioSource.js';
import { pauseQuestion, resumeQuestion } from '../../domain/game/timing.js';
import { restoreSession } from '../../domain/game/checkpoint.js';
import { errorMessage } from '../shared/errorMessage.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  finishSession,
  canSeekRound,
  createSession,
  nextRound,
  revealAnswer,
  startRound,
  takeCard,
} from '../../domain/game/session.js';
import type { GameSession } from '../../domain/game/session.js';
import { GameAudio } from '../../infrastructure/audio/gameAudio.js';
import type { TrackProgress } from '../../infrastructure/audio/audioProgress.js';
import { useAudioVolume } from '../audio/useAudioVolume.js';
import { useGameFeedback } from './useGameFeedback.js';

export function useGame<Song extends { id: string }>(
  songs: Song[],
  sourceFor: (song: Song) => readonly string[],
  recordReview: (songId: string, correct: boolean) => void,
  saveSession: (session: GameSession) => void,
  timingPaused: boolean,
) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [playing, setPlaying] = useState(false);
  const [needsResume, setNeedsResume] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { volume, muted, effectiveVolume, setVolume, toggleMuted } = useAudioVolume();
  const { feedback, revision, notify, clear } = useGameFeedback(effectiveVolume, setError);
  const current = useRef<GameSession | null>(null);
  const [progress, setProgress] = useState<TrackProgress>({ position: 0, duration: 0 });
  const player = useRef<GameAudio | null>(null);
  const generation = useRef(0);
  const suspended = useRef(false);
  const update = useCallback(
    (value: GameSession | null) => {
      current.current = value;
      setSession(value);
      if (value) saveSession(pauseQuestion(value, performance.now()));
    },
    [saveSession],
  );
  useEffect(() => {
    const audio = new GameAudio((progress, playing, needsResume) => {
      setProgress(progress);
      setPlaying(playing);
      setNeedsResume(needsResume);
      const previous = current.current;
      if (playing && previous?.phase === 'ready') {
        const now = performance.now();
        const next = startRound(previous, now);
        update(document.hidden || suspended.current ? pauseQuestion(next, now) : next);
        setError('');
      }
    });
    audio.volume(0.7);
    player.current = audio;
    return () => {
      if (current.current && current.current.phase !== 'complete')
        saveSession(pauseQuestion(current.current, performance.now()));
      void audio.dispose();
    };
  }, [saveSession, update]);
  useEffect(() => {
    player.current?.volume(effectiveVolume);
  }, [effectiveVolume]);

  useEffect(() => {
    suspended.current = timingPaused || needsResume;
    const apply = () => {
      const previous = current.current;
      if (!previous) return;
      const next =
        document.hidden || suspended.current
          ? pauseQuestion(previous, performance.now())
          : resumeQuestion(previous, performance.now());
      if (next !== previous) update(next);
    };
    const hide = () => {
      const previous = current.current;
      if (!previous) return;
      const next = pauseQuestion(previous, performance.now());
      if (next !== previous) update(next);
    };
    apply();
    document.addEventListener('visibilitychange', apply);
    window.addEventListener('pagehide', hide);
    window.addEventListener('pageshow', apply);
    return () => {
      document.removeEventListener('visibilitychange', apply);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('pageshow', apply);
    };
  }, [timingPaused, needsResume, update]);
  function reset() {
    generation.current++;
    player.current?.clear();
    setLoading(false);
    update(null);
    setError('');
    setProgress({ position: 0, duration: 0 });
    clear();
  }
  async function beginFrom(selectedSongs: Song[], size: number, capacity: number) {
    reset();
    diagnostic('solo.begin', { capacity, size });
    try {
      update(
        createSession(
          selectedSongs.filter((song) => sourceFor(song).length > 0).map((song) => song.id),
          size,
          capacity,
          Math.random,
        ),
      );
      await play();
    } catch (reason) {
      setError(errorMessage(reason, '開始できません'));
    }
  }
  async function restore(saved: GameSession) {
    reset();
    try {
      const available = new Set(
        songs.filter((song) => sourceFor(song).length > 0).map((song) => song.id),
      );
      if (saved.order.some((id) => !available.has(id)))
        throw new Error('前回の練習に現在再生できない曲が含まれています');
      update(restoreSession(saved));
      await play();
    } catch (reason) {
      setError(errorMessage(reason, '前回の練習を再開できません'));
    }
  }
  async function play() {
    const round = current.current;
    if (!round || !['ready', 'playing', 'revealed'].includes(round.phase)) return;
    const song = songs.find((item) => item.id === round.order[round.round]);
    const source = song ? sourceForRound(sourceFor(song), round.round) : undefined;
    if (!source || !player.current) {
      setError('この曲の再生音源がありません');
      return;
    }
    diagnostic('solo.play', { round: round.round + 1, phase: round.phase, song: song?.id ?? null });
    const request = ++generation.current;
    setLoading(true);
    setError('');
    try {
      await player.current.play(source);
    } catch (reason) {
      if (request === generation.current) setError(errorMessage(reason, '音源を再生できません'));
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }
  async function resume() {
    if (current.current?.phase === 'ready' && progress.duration === 0) {
      await play();
      return;
    }
    const request = generation.current;
    try {
      await player.current?.resume();
      if (request === generation.current) setError('');
    } catch (reason) {
      if (request === generation.current) setError(errorMessage(reason, '再生できません'));
    }
  }
  function cancelAudio() {
    generation.current++;
    player.current?.stop();
    setLoading(false);
  }
  async function seek(position: number) {
    if (!current.current || !canSeekRound(current.current)) return;
    const request = generation.current;
    try {
      await player.current?.seek(position);
    } catch (reason) {
      if (request === generation.current)
        setError(errorMessage(reason, '再生位置を変更できません'));
    }
  }
  const take = useCallback(
    (id: string) => {
      const previous = current.current;
      if (!previous) return;
      const next = takeCard(previous, id, performance.now());
      if (next === previous) return;
      const kind = next.mistakes > previous.mistakes ? 'incorrect' : 'correct';
      diagnostic(`solo.${kind}`, {
        round: previous.round + 1,
        results: next.results.length,
        reserve: next.reserve.length,
      });
      const answer = previous.order[previous.round];
      if (answer && previous.incorrect.length === 0) recordReview(answer, kind === 'correct');
      notify(kind, kind === 'correct' ? (next.times.at(-1) ?? null) : null);
      update(next);
    },
    [notify, update, recordReview],
  );
  function reveal() {
    if (current.current?.phase === 'playing') {
      const round = current.current;
      const answer = round.order[round.round];
      if (answer && round.incorrect.length === 0) recordReview(answer, false);
      notify('skipped');
      update(revealAnswer(current.current, performance.now()));
    }
  }
  async function next() {
    if (current.current?.phase === 'revealed') {
      cancelAudio();
      const next = nextRound(current.current);
      diagnostic('solo.next', {
        round: next.round + 1,
        phase: next.phase,
        results: next.results.length,
      });
      update(next);
      setError('');
      clear(true);
      if (next.phase === 'ready') await play();
      else {
        player.current?.clear();
        notify('complete');
      }
    }
  }
  return {
    session,
    feedback,
    revision,
    playing,
    needsResume,
    progress,
    loading,
    error,
    beginFrom,
    restore,
    resume,
    take,
    reveal,
    next,
    reset,
    finish: () => {
      if (!current.current || current.current.phase === 'complete') return;
      cancelAudio();
      update(finishSession(current.current, performance.now()));
      player.current?.clear();
      notify('complete');
    },
    pause: cancelAudio,
    seek,
    volume,
    muted,
    setVolume,
    toggleMuted,
  };
}
