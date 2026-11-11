import { errorMessage } from '../shared/errorMessage.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { v4 } from 'uuid';
import { applyRoomPatch } from '../../domain/multiplayer/transport.js';
import { eventSchema } from '../../domain/multiplayer/protocol.js';
import type { Command, RoomView } from '../../domain/multiplayer/protocol.js';
import { GameAudio } from '../../infrastructure/audio/gameAudio.js';
import { useAudioVolume } from '../audio/useAudioVolume.js';
import { useGameFeedback } from '../game/useGameFeedback.js';
import { roomClaimant, roomFeedback } from '../../domain/multiplayer/feedback.js';
import type { TrackProgress } from '../../infrastructure/audio/audioProgress.js';
import { useKarutaConfig } from '../config/karutaProvider.js';
import { RoomConnection } from '../../infrastructure/multiplayer/roomConnection.js';
import { useRoomClock } from './useRoomClock.js';
import { useRoomAudioActions } from './useRoomAudioActions.js';
import { useRoomExit } from './roomExitGuard.js';
import { useRoomLifecycle } from './useRoomLifecycle.js';

export function useRoom() {
  const { storagePrefix, request } = useKarutaConfig();
  const [roomId, setRoomId] = useState(new URL(location.href).searchParams.get('room') ?? '');
  const [room, setRoom] = useState<RoomView | null>(null);
  const [you, setYou] = useState('');
  const [connected, setConnected] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const clock = useRoomClock(room?.startsAt ?? null);
  const { reset: resetClock, receive: receiveClock, rtt: roundTripTime } = clock;
  const socket = useRef<RoomConnection | null>(null);
  const audio = useRef<GameAudio | null>(null);
  const preparationFailed = useRef(false);
  const [preparationAttempt, setPreparationAttempt] = useState(0);
  const [prepared, setPrepared] = useState<{ url: string; round: number; attempt: number } | null>(
    null,
  );
  const { volume, muted, effectiveVolume, setVolume, toggleMuted } = useAudioVolume();
  const effects = useGameFeedback(effectiveVolume, setError);
  const current = useRef<RoomView | null>(null);
  const connectionPlayer = useRef('');
  const attempted = useRef<string | null>(null);
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
    current.current = null;
    setRoom(null);
    setPrepared(null);
    resetClock();
  }, [resetClock]);
  const leave = useCallback(() => {
    socket.current?.leave();
    disconnect();
    setRoomId('');
    history.replaceState(null, '', location.pathname);
  }, [disconnect]);
  useRoomExit(leave, room !== null);
  useEffect(() => disconnect, [disconnect]);
  const recover = useCallback(() => {
    resetClock();
    if (preparationFailed.current) setPreparationAttempt((attempt) => attempt + 1);
  }, [resetClock]);
  useRoomLifecycle(socket, recover);
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
      const key = `${storagePrefix}-room:${id}`;
      const token = sessionStorage.getItem(key) ?? v4();
      sessionStorage.setItem(key, token);
      const endpoint = new URL(`/api/rooms/${id}`, location.href);
      endpoint.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      endpoint.searchParams.set('token', token);
      endpoint.searchParams.set('spectator', String(spectator));
      endpoint.searchParams.set('connectionId', v4());
      endpoint.searchParams.set('name', name.trim());
      let serverError = '';
      let established = false;
      const connection = new RoomConnection(endpoint.href, {
        status: (connected) => {
          setConnected(connected);
          setJoining(false);
          setPrepared(null);
          resetClock();
          if (!connected) player.clear();
        },
        message: (data) => {
          let input: unknown;
          try {
            input = JSON.parse(data);
          } catch {
            setError(serverError || '対戦データを読み込めません');
            return;
          }
          const parsed = eventSchema.safeParse(input);
          if (!parsed.success) {
            setError('対戦データの形式が一致しません');
            return;
          }
          const message = parsed.data;
          if (message.type === 'error') {
            serverError = message.message;
            setError(message.message);
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
            if (previous?.round !== next.round || next.phase === 'loading') {
              effects.clear(next.round > 0);
              setIncorrect([]);
            }
            if (kind) effects.notify(kind, null, roomClaimant(next, playerId));
            if (kind === 'incorrect' && attempted.current) setIncorrect([attempted.current]);
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
  const audioUrl = room?.audio ?? null;
  const round = room?.round ?? 0;
  const audioReady =
    connected &&
    prepared?.url === audioUrl &&
    prepared?.round === round &&
    prepared?.attempt === preparationAttempt;
  useEffect(() => {
    if (!audioUrl || !connected) {
      audio.current?.stop();
      return;
    }
    let active = true;
    let retry: ReturnType<typeof setTimeout>;
    preparationFailed.current = false;
    void audio.current
      ?.prepare(audioUrl)
      .then((ready) => {
        if (active && ready) {
          setPrepared({ url: audioUrl, round, attempt: preparationAttempt });
          setError('');
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          preparationFailed.current = true;
          setError(errorMessage(reason, '音声を準備できません'));
          retry = setTimeout(() => setPreparationAttempt((attempt) => attempt + 1), 5000);
        }
      });
    return () => {
      active = false;
      clearTimeout(retry);
      audio.current?.clear();
    };
  }, [audioUrl, round, connected, preparationAttempt]);
  useEffect(() => {
    if (
      connected &&
      room?.phase === 'loading' &&
      !room.spectators.some((person) => person.id === you) &&
      audioReady &&
      clock.ready
    ) {
      send({ type: 'ready', round: room.round, sent: Date.now(), rtt: roundTripTime() });
    }
  }, [
    connected,
    room?.spectators,
    you,
    room?.phase,
    room?.round,
    room?.audio,
    audioReady,
    clock.ready,
    roundTripTime,
    send,
  ]);
  useEffect(() => {
    if (room?.phase !== 'playing' || room.startsAt === null || !audioReady || !clock.ready) return;
    const controller = new AbortController();
    void audio.current
      ?.schedule(room.startsAt, clock.read, controller.signal)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(reason, '音声を開始できません'));
      });
    return () => controller.abort();
  }, [
    room?.phase,
    room?.startsAt,
    room?.audio,
    room?.round,
    audioReady,
    clock.ready,
    clock.revision,
    clock.read,
  ]);
  const take = useCallback(
    (id: string) => {
      const state = current.current;
      if (!state || state.spectators.some((person) => person.id === connectionPlayer.current))
        return;
      attempted.current = id;
      send({ type: 'take', round: state.round, id });
    },
    [send],
  );
  return {
    audioReady: clock.ready && audioReady,
    feedback: effects.feedback,
    revision: effects.revision,
    incorrect,
    progress,
    playing,
    needsResume,
    take,
    ...useRoomAudioActions(audio, setError, effectiveVolume),
    pause: () => audio.current?.stop(),
    roomId,
    spectator: room?.spectators.some((person) => person.id === you) ?? false,
    room,
    you,
    connected,
    joining,
    error,
    latency: clock.latency,
    now: clock.now,
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
