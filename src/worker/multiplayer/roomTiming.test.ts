import { expect, it } from 'vite-plus/test';
import type { z } from 'zod';
import { attachmentSchema } from './roomIdentity.js';
import { eventSchema } from '../../domain/multiplayer/protocol.js';
import { acknowledgeProbe, probeSocket, type TimingSocket } from './roomTiming.js';

class Socket implements TimingSocket {
  readyState = 1;
  identity: z.infer<typeof attachmentSchema> = {
    id: 'a',
    connectionId: '00000000-0000-4000-8000-000000000001',
    spectator: false,
    last: 0,
    ping: 0,
    samples: [],
    probe: null,
    lastProbe: 0,
  };
  events: z.infer<typeof eventSchema>[] = [];
  serializeAttachment(value: unknown) {
    this.identity = attachmentSchema.parse(value);
  }
  deserializeAttachment() {
    return this.identity;
  }
  send(message: unknown) {
    if (typeof message !== 'string') throw new Error('文字列以外の通知です');
    this.events.push(eventSchema.parse(JSON.parse(message)));
  }
}
it('遅い回線でも最初の応答後に2回目を測定し、準備完了を一度だけ通知する', () => {
  const socket = new Socket();
  probeSocket(socket, 100000);
  acknowledgeProbe(socket, socket.identity.probe!.id, 102000);
  expect(socket.identity.samples).toEqual([2000]);
  expect(socket.identity.probe).not.toBeNull();
  acknowledgeProbe(socket, socket.identity.probe!.id, 104000);
  expect(socket.identity.samples).toEqual([2000, 2000]);
  expect(socket.events.filter((event) => event.type === 'timingReady')).toHaveLength(1);
  probeSocket(socket, 140000);
  acknowledgeProbe(socket, socket.identity.probe!.id, 142000);
  expect(socket.events.filter((event) => event.type === 'timingReady')).toHaveLength(1);
});
it('時刻同期の同一バースト中は測定を重複させない', () => {
  const socket = new Socket();
  socket.identity.samples = [100, 120];
  probeSocket(socket, 100000);
  acknowledgeProbe(socket, socket.identity.probe!.id, 100100);
  const count = socket.events.length;
  probeSocket(socket, 100200);
  probeSocket(socket, 100500);
  expect(socket.events).toHaveLength(count);
  probeSocket(socket, 101000);
  expect(socket.events).toHaveLength(count + 1);
});
it('観戦者の通信時間を測定しない', () => {
  const socket = new Socket();
  socket.identity.spectator = true;
  probeSocket(socket, 100000);
  expect(socket.events).toHaveLength(0);
});
it('不明な確認と10秒超の測定を取得判定に使わない', () => {
  const socket = new Socket();
  probeSocket(socket, 100000);
  acknowledgeProbe(socket, crypto.randomUUID(), 101000);
  expect(socket.identity.samples).toEqual([]);
  acknowledgeProbe(socket, socket.identity.probe!.id, 111000);
  expect(socket.identity.samples).toEqual([]);
});
