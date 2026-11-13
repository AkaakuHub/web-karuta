import { Alert } from '@mui/material';
import { useGameToast } from '../game/gameToast.js';
import { useRoomSynchronization } from './useRoomSynchronization.js';
import { errorMessage } from '../shared/errorMessage.js';
import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { applyRoomPatch } from '../../domain/multiplayer/transport.js';
import { readRoomEvent } from '../../infrastructure/multiplayer/readRoomEvent.js';
import type { Command, RoomView } from '../../domain/multiplayer/protocol.js';
import { GameAudio } from '../../infrastructure/audio/gameAudio.js';
import { useAudioVolume } from '../audio/useAudioVolume.js';
import { useGameFeedback } from '../game/useGameFeedback.js';
import { roomClaimant, roomFeedback } from '../../domain/multiplayer/feedback.js';
import type { TrackProgress } from '../../infrastructure/audio/audioProgress.js';
import { useKarutaConfig } from '../config/karutaProvider.js';
import { RoomConnection } from '../../infrastructure/multiplayer/roomConnection.js';
import { useRoomPreparation } from './useRoomPreparation.js';
import { connectRoom } from './connectRoom.js';
import { useRoomClock } from './useRoomClock.js';
import { useRoomAudioActions } from './useRoomAudioActions.js';
import { useRoomExit } from './roomExitGuard.js';
import { useRoomLifecycle } from './useRoomLifecycle.js';

export function useRoom() {
  const { storagePrefix, request } = useKarutaConfig();
  const { show: showToast } = useGameToast();
  const [roomId, setRoomId] = useState(new URL(location.href).searchParams.get('room') ?? '');
  const [room, setRoom] = useState<RoomView | null>(null);
  const [you, setYou] = useState('');
  const [connected, setConnected] = useState(false);
  const [timingReady, setTimingReady] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const clock = useRoomClock();
  const { reset: resetClock, receive: receiveClock, reschedule: rescheduleAudio } = clock;
  const socket = useRef<RoomConnection | null>(null);
  const audio = useRef<GameAudio | null>(null);
  const preparation = useRoomPreparation(
    audio,
    connected,
    room?.audio ?? null,
    room?.round ?? 0,
    setError,
  );
  const { reset: resetPreparation, retry: retryPreparation } = preparation;
  const [pendingTake, setPendingTake] = useState<{ id: string; accepted: boolean } | null>(null);
  const acceptedRound = useRef<number | null>(null);
  const { volume, muted, effectiveVolume, setVolume, toggleMuted } = useAudioVolume();
  const effects = useGameFeedback(effectiveVolume, setError);
  const current = useRef<RoomView | null>(null);
  const connectionPlayer = useRef('');
  const submittedRound = useRef<number | null>(null);
  const [incorrect, setIncorrect] = useState<string[]>([]);
  const [progress, setProgress] = useState<TrackProgress>({ position: 0, duration: 0 });
  const [playing, setPlaying] = useState(false);
  const [needsResume, setNeedsResume] = useState(false);
  const send = useCallback((command: Command) => {
    socket.current?.send(command);
  }, []);
  const disconnect = useCallback(() => {
    socket.current?.close();
    socket.current = null;
    void audio.current?.dispose();
    audio.current = null;
    setConnected(false);
    setTimingReady(false);
    current.current = null;
    setRoom(null);
    resetPreparation();
    resetClock();
  }, [resetClock, resetPreparation]);
  const leave = useCallback(() => {
    socket.current?.leave();
    disconnect();
    setRoomId('');
    history.replaceState(null, '', location.pathname);
  }, [disconnect]);
  useRoomExit(leave, room !== null);
  useEffect(() => disconnect, [disconnect]);
  const recover = useCallback(() => {
    rescheduleAudio();
    socket.current?.wake(true);
    retryPreparation();
  }, [retryPreparation, rescheduleAudio]);
  useRoomLifecycle(socket, retryPreparation);
  async function join(name: string, create: boolean, code: string, spectator: boolean) {
    if (joining) return;
    disconnect();
    setJoining(true);
    setError('');
    try {
      const player = new GameAudio((progress, playing, needsResume) => {
        setProgress(progress);
        setPlaying(playing);
        setNeedsResume(needsResume);
      }, recover);
      player.volume(effectiveVolume);
      audio.current = player;
      await Promise.all([player.unlock(), effects.unlock()]);
      let id = code.trim();
      if (create) {
        id = z.object({ id: z.uuid() }).parse(await request('/api/rooms', { method: 'POST' })).id;
      }
      if (!z.uuidv7().safeParse(id).success)
        throw new Error('UUIDv7の部屋コードを入力してください');
      setRoomId(id);
      const url = new URL(location.href);
      url.searchParams.set('room', id);
      history.replaceState(null, '', url);
      let serverError = '';
      let established = false;
      const connection = connectRoom(id, name, spectator, storagePrefix, {
        status: (connected) => {
          setConnected(connected);
          setTimingReady(false);
          setPendingTake(null);
          submittedRound.current = null;
          acceptedRound.current = null;
          setJoining(false);
          resetPreparation();
          resetClock();
          if (!connected) player.cancelPreparation();
        },
        message: (data) => {
          const { event: message, error } = readRoomEvent(data);
          if (!message) {
            setError(serverError || error);
            return;
          }
          if (
            message.type === 'takeAccepted' &&
            message.round === current.current?.round &&
            submittedRound.current === message.round &&
            acceptedRound.current !== message.round
          ) {
            acceptedRound.current = message.round;
            setPendingTake((pending) => (pending ? { ...pending, accepted: true } : null));
            effects.notify('correct');
          }
          if (message.type === 'timingReady') setTimingReady(true);
          if (message.type === 'probe') send({ type: 'probeAck', id: message.id });
          if (message.type === 'error') {
            serverError = message.message;
            setError(message.message);
            setPendingTake(null);
            submittedRound.current = null;
          }
          if (message.type === 'state' || message.type === 'update') {
            established = true;
            serverError = '';
            const previous = current.current;
            if (message.type === 'update' && !previous) throw new Error('初期状態がありません');
            const next =
              message.type === 'state' ? message.room : applyRoomPatch(previous!, message.room);
            const playerId = message.type === 'state' ? message.you : connectionPlayer.current;
            if (!playerId) throw new Error('参加情報がありません');
            const kind = roomFeedback(previous, next, playerId);
            if (
              message.type === 'state' ||
              previous?.round !== next.round ||
              next.phase === 'loading'
            ) {
              setPendingTake(null);
              submittedRound.current = null;
            }
            if (previous?.round !== next.round || next.phase === 'loading') {
              effects.clear(next.round > 0);
              setIncorrect([]);
              acceptedRound.current = null;
            }
            if (kind) {
              setPendingTake(null);
              if (
                kind !== 'correct' ||
                next.winner !== playerId ||
                acceptedRound.current !== next.round
              )
                effects.notify(kind, null, roomClaimant(next, playerId));
            }
            setIncorrect(next.incorrect[playerId] ?? []);
            current.current = next;
            connectionPlayer.current = playerId;
            const person = [...next.players, ...next.spectators].find(
              (person) => person.id === playerId,
            );
            if (person) localStorage.setItem(`${storagePrefix}-name`, person.name);
            setYou(playerId);
            setRoom(next);
            setError('');
          }
          if (message.type === 'pong') receiveClock(message);
        },
        closed: (code, reason, retrying) => {
          if (code === 4003 || code === 4004) {
            disconnect();
            setRoomId('');
            history.replaceState(null, '', location.pathname);
          }
          setError(
            serverError ||
              reason ||
              (retrying
                ? '接続が切れました。再接続しています。'
                : `${established ? '接続が切れました' : '接続を確立できませんでした'}（WebSocket ${code}）。`),
          );
        },
      });
      socket.current = connection;
      connection.start();
    } catch (reason) {
      setJoining(false);
      setError(errorMessage(reason, '参加できません'));
    }
  }
  useEffect(() => {
    if (!connected || !pendingTake) return;
    const timer = setTimeout(() => socket.current?.wake(true), 3000);
    return () => clearTimeout(timer);
  }, [connected, pendingTake?.id]);
  const audioReady = preparation.ready;
  useRoomSynchronization({
    room,
    you,
    connected,
    timingReady,
    audioReady,
    clock,
    audio,
    connection: socket,
    setError,
  });
  const take = useCallback(
    (id: string, at: number) => {
      const state = current.current;
      if (state?.phase === 'playing' && state.blocked.includes(connectionPlayer.current)) {
        showToast(
          'mistake',
          createElement(
            Alert,
            { severity: 'warning' },
            '前のターンのお手つきにより、このターンは札を取れません。',
          ),
        );
        return;
      }
      if (
        !state ||
        state.phase !== 'playing' ||
        !state.ready.includes(connectionPlayer.current) ||
        submittedRound.current === state.round ||
        (state.incorrect[connectionPlayer.current]?.length ?? 0) > 0 ||
        state.spectators.some((person) => person.id === connectionPlayer.current)
      )
        return;
      try {
        const elapsedMs = audio.current?.reactionTime(at);
        if (elapsedMs === undefined || elapsedMs < 0) return;
        if (!socket.current?.send({ type: 'take', round: state.round, id, elapsedMs })) {
          socket.current?.wake(true);
          setError('接続を確認しています');
          return;
        }
        submittedRound.current = state.round;
        setPendingTake({ id, accepted: false });
      } catch (reason) {
        setError(errorMessage(reason, '入力時刻を確認できません'));
      }
    },
    [showToast],
  );
  return {
    audioReady: clock.ready && audioReady,
    feedback: effects.feedback,
    revision: effects.revision,
    incorrect,
    pendingTake: pendingTake?.id ?? null,
    takeAccepted: pendingTake?.accepted ?? false,
    progress,
    playing,
    needsResume: needsResume || preparation.failed,
    take,
    ...useRoomAudioActions(audio, setError, effectiveVolume, retryPreparation),
    pause: () => audio.current?.stop(),
    roomId,
    spectator: room?.spectators.some((person) => person.id === you) ?? false,
    room,
    you,
    connected,
    joining,
    error,
    latency: clock.latency,
    send,
    rename: (name: string) => send({ type: 'rename', name }),
    join,
    volume,
    muted,
    setVolume,
    toggleMuted,
    leave,
  };
}
