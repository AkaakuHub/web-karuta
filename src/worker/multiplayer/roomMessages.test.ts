import { expect, it } from 'vite-plus/test';
import { emptyRoom } from '../../domain/multiplayer/room.js';
import { eventSchema } from '../../domain/multiplayer/protocol.js';
import { attachmentSchema } from './roomIdentity.js';
import { readRoomMessage } from './roomMessages.js';

function setup() {
  const connectionId = crypto.randomUUID();
  let attachment = attachmentSchema.parse({
    id: 'a',
    connectionId,
    spectator: false,
    last: 990,
    ping: 0,
    samples: [80, 100],
    probe: null,
    lastProbe: 0,
  });
  const events: ReturnType<typeof eventSchema.parse>[] = [];
  const socket = {
    close: () => {},
    send: (data: string | ArrayBuffer | ArrayBufferView) =>
      events.push(eventSchema.parse(JSON.parse(String(data)))),
    deserializeAttachment: () => attachment,
    serializeAttachment: (value: unknown) => {
      attachment = attachmentSchema.parse(value);
    },
  };
  const tokens = { token: { id: 'a', connectionId, spectator: false } };
  const room = emptyRoom('a');
  const command = { type: 'take', round: 0, id: 'card', elapsedMs: 100 };
  return { socket, tokens, room, command, events };
}
it('40ms以内の再入力を拒否するときも明示的に応答する', () => {
  const { socket, tokens, room, command, events } = setup();
  expect(readRoomMessage(socket, JSON.stringify(command), room, tokens, 1000)).toBeNull();
  expect(events).toEqual([{ type: 'takeRejected', round: 0 }]);
  expect(readRoomMessage(socket, JSON.stringify(command), room, tokens, 1050)?.command).toEqual(
    command,
  );
});
it('古いターンの入力にも拒否を返し、判定待ちを残さない', () => {
  const { socket, tokens, room, command, events } = setup();
  expect(
    readRoomMessage(socket, JSON.stringify({ ...command, round: 1 }), room, tokens, 1050),
  ).toBeNull();
  expect(events).toEqual([{ type: 'takeRejected', round: 1 }]);
});
