import { expect, it } from 'vite-plus/test';
import { emptyRoom, type Room } from '../../domain/multiplayer/room.js';
import { eventSchema } from '../../domain/multiplayer/protocol.js';
import { submitSocketClaim } from './roomClaim.js';
import type { TimingSocket } from './roomTiming.js';

function setup() {
  const events: ReturnType<typeof eventSchema.parse>[] = [];
  const identity = {
    id: 'a',
    connectionId: crypto.randomUUID(),
    spectator: false,
    last: 0,
    ping: 0,
    samples: [80, 100],
    probe: null,
    lastProbe: 0,
  };
  const socket: TimingSocket = {
    readyState: 1,
    deserializeAttachment: () => identity,
    serializeAttachment: () => {},
    send: (data) => events.push(eventSchema.parse(JSON.parse(String(data)))),
  };
  const room: Room = {
    ...emptyRoom('a'),
    phase: 'playing',
    startsAt: 1000,
    order: ['correct', 'wrong'],
    board: ['correct', 'wrong'],
    ready: ['a', 'b'],
    players: ['a', 'b'].map((id) => ({ id, name: id, score: 0, connected: true })),
  };
  const command = { type: 'take' as const, round: 0, id: 'correct', elapsedMs: 1000 };
  return { room, socket, events, command };
}
it('正解を受付期間内に一度だけ記録し、重複送信には受付済みと返す', () => {
  const { room, socket, events, command } = setup();
  const first = submitSocketClaim(room, null, socket, command, 2050, [socket]);
  expect(first.accepted).toBe(true);
  const second = submitSocketClaim(first.room, first.pending, socket, command, 2060, [socket]);
  expect(second.pending?.entries).toHaveLength(1);
  expect(events).toEqual([{ type: 'takeAccepted', round: 0 }]);
});
it.each(['blocked', 'unready'] as const)('取得不可（%s）も応答し、判定待ちに残さない', (reason) => {
  const { room, socket, events, command } = setup();
  const unavailable = reason === 'blocked' ? { ...room, blocked: ['a'] } : { ...room, ready: [] };
  const result = submitSocketClaim(unavailable, null, socket, command, 2050, [socket]);
  expect(result.room).toBe(unavailable);
  expect(result.pending).toBeNull();
  expect(events).toEqual([{ type: 'takeRejected', round: 0 }]);
});
it('お手つきは状態更新で伝え、他の札を再取得できる状態へ戻さない', () => {
  const { room, socket, events, command } = setup();
  const wrong = submitSocketClaim(room, null, socket, { ...command, id: 'wrong' }, 2050, [socket]);
  expect(wrong.room.incorrect.a).toEqual(['wrong']);
  expect(events).toEqual([]);
  const retry = submitSocketClaim(wrong.room, null, socket, command, 2100, [socket]);
  expect(retry.room).toBe(wrong.room);
  expect(events).toEqual([{ type: 'takeRejected', round: 0 }]);
});
