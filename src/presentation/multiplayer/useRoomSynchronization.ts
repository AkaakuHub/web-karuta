import { useEffect, type RefObject } from 'react';
import type { RoomView } from '../../domain/multiplayer/protocol.js';
import type { GameAudio } from '../../infrastructure/audio/gameAudio.js';
import type { RoomConnection } from '../../infrastructure/multiplayer/roomConnection.js';
import type { useRoomClock } from './useRoomClock.js';
import { errorMessage } from '../shared/errorMessage.js';

export function useRoomSynchronization({
  room,
  you,
  connected,
  pendingId,
  timingReady,
  audioReady,
  clock,
  audio,
  connection,
  setError,
}: {
  room: RoomView | null;
  you: string;
  connected: boolean;
  pendingId: string | null;
  timingReady: boolean;
  audioReady: boolean;
  clock: ReturnType<typeof useRoomClock>;
  audio: RefObject<GameAudio | null>;
  connection: RefObject<RoomConnection | null>;
  setError: (message: string) => void;
}) {
  useEffect(() => {
    if (!connected || !pendingId) return;
    const timer = setTimeout(() => connection.current?.wake(true), 3000);
    return () => clearTimeout(timer);
  }, [connected, pendingId, connection]);
  useEffect(() => {
    if (connected && room?.phase === 'loading') connection.current?.synchronize();
  }, [connected, room?.phase, room?.round]);
  useEffect(() => {
    if (
      connected &&
      timingReady &&
      !room?.ready.includes(you) &&
      (room?.phase === 'loading' || room?.phase === 'playing') &&
      !room.spectators.some((person) => person.id === you) &&
      audioReady &&
      clock.ready
    ) {
      connection.current?.send({
        type: 'ready',
        round: room.round,
        sent: performance.timeOrigin + performance.now(),
      });
    }
  }, [
    connected,
    timingReady,
    room?.spectators,
    room?.ready,
    you,
    room?.phase,
    room?.round,
    room?.audio,
    audioReady,
    clock.ready,
    connection,
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
}
