import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test';
import {
  RoomConnection,
  type ConnectionSocket,
} from '../../infrastructure/multiplayer/roomConnection.js';
import { commandSchema, type Command } from '../../domain/multiplayer/protocol.js';

class SocketCloseEvent extends Event {
  readonly wasClean = false;
  readonly reason = '';
  constructor(readonly code: number) {
    super('close');
  }
}
class Socket implements ConnectionSocket {
  readyState = 0;
  onopen: ConnectionSocket['onopen'] = null;
  onmessage: ConnectionSocket['onmessage'] = null;
  onclose: ConnectionSocket['onclose'] = null;
  onerror: ConnectionSocket['onerror'] = null;
  sent: Command[] = [];
  constructor(readonly url: string) {}
  send(data: string) {
    this.sent.push(commandSchema.parse(JSON.parse(data)));
  }
  close() {
    this.readyState = 3;
  }
  open() {
    this.readyState = 1;
    this.onopen?.(new Event('open'));
  }
  receive() {
    this.onmessage?.(
      new MessageEvent('message', {
        data: JSON.stringify({ type: 'pong', sent: Date.now(), now: Date.now() }),
      }),
    );
  }
  drop(code = 1006) {
    this.readyState = 3;
    this.onclose?.(new SocketCloseEvent(code));
  }
}

const active: RoomConnection[] = [];
function setup() {
  const sockets: Socket[] = [];
  const statuses: boolean[] = [];
  const messages: string[] = [];
  const connection = new RoomConnection(
    'wss://example.test/room?token=existing-player',
    {
      status: (value) => statuses.push(value),
      message: (data) => messages.push(data),
      closed: () => {},
    },
    (url) => {
      const socket = new Socket(url);
      sockets.push(socket);
      return socket;
    },
  );
  active.push(connection);
  connection.start();
  sockets[0]!.open();
  sockets[0]!.receive();
  return { connection, sockets, statuses, messages };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(100000);
});
afterEach(() => {
  active.splice(0).forEach((connection) => connection.close());
  vi.useRealTimers();
});

it('電波断後に同じ参加者のURLで再接続し、切断中の操作を送信しない', async () => {
  const { connection, sockets, statuses } = setup();
  const original = sockets[0]!;
  original.drop();
  connection.send({ type: 'next', round: 20 });
  await vi.advanceTimersByTimeAsync(1000);
  expect(sockets).toHaveLength(2);
  expect(sockets[1]!.url).toBe(original.url);
  sockets[1]!.open();
  expect(statuses).toEqual([true, false, true]);
  expect(sockets[1]!.sent.some((command) => command.type === 'next')).toBe(false);
});

it('スリープ中にclose通知が来なくても、復帰時に接続を作り直す', () => {
  const { connection, sockets, messages } = setup();
  const lateMessage = sockets[0]!.onmessage!;
  const lateClose = sockets[0]!.onclose!;
  vi.setSystemTime(Date.now() + 120000);
  connection.wake(true);
  expect(sockets).toHaveLength(2);
  lateMessage(new MessageEvent('message', { data: '{}' }));
  lateClose(new SocketCloseEvent(1006));
  expect(messages).toHaveLength(1);
  expect(sockets).toHaveLength(2);
});

it('応答のある低速接続は定期確認で維持し、復帰時は全状態を要求する', async () => {
  const { connection, sockets } = setup();
  for (let index = 0; index < 5; index++) {
    await vi.advanceTimersByTimeAsync(15000);
    await vi.advanceTimersByTimeAsync(1500);
    sockets[0]!.receive();
  }
  connection.wake(true);
  expect(sockets).toHaveLength(1);
  expect(sockets[0]!.sent.some((command) => command.type === 'sync')).toBe(true);
  expect(sockets[0]!.sent.filter((command) => command.type === 'ping').length).toBeGreaterThan(5);
});

it('見かけ上OPENでも応答が途絶えた接続を交換する', async () => {
  const { sockets } = setup();
  await vi.advanceTimersByTimeAsync(45000);
  expect(sockets).toHaveLength(2);
  expect(sockets[0]!.readyState).toBe(3);
});

it('復帰時の同期要求に応答がなければ、定期確認を待たず接続を交換する', async () => {
  const { connection, sockets } = setup();
  connection.wake(true);
  await vi.advanceTimersByTimeAsync(10000);
  expect(sockets).toHaveLength(2);
  expect(sockets[0]!.readyState).toBe(3);
});

it('close通知より先に切断状態になった接続は、復帰時に即座に交換する', () => {
  const { connection, sockets } = setup();
  sockets[0]!.close();
  connection.wake(true);
  expect(sockets).toHaveLength(2);
});

it('自分で退出した後は復帰イベントや再接続タイマーで戻らない', async () => {
  const { connection, sockets } = setup();
  sockets[0]!.drop();
  connection.close();
  connection.wake(true);
  await vi.advanceTimersByTimeAsync(120000);
  expect(sockets).toHaveLength(1);
  expect(vi.getTimerCount()).toBe(0);
});

it.each([1008, 4000, 4001, 4003])(
  '拒否・期限切れ・接続切替・キック（%i）は再接続しない',
  async (code) => {
    const { connection, sockets } = setup();
    sockets[0]!.drop(code);
    connection.wake(true);
    await vi.advanceTimersByTimeAsync(120000);
    expect(sockets).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
  },
);

it('ページ凍結中は通信せず、復帰後は同じ参加者で再接続する', async () => {
  const { connection, sockets, statuses } = setup();
  const original = sockets[0]!;
  connection.suspend();
  await vi.advanceTimersByTimeAsync(120000);
  expect(sockets).toHaveLength(1);
  expect(vi.getTimerCount()).toBe(0);
  connection.wake(true);
  expect(sockets).toHaveLength(2);
  expect(sockets[1]!.url).toBe(original.url);
  sockets[1]!.open();
  expect(statuses).toEqual([true, false, false, true]);
});
