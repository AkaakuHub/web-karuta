import { readRoomEvent } from './readRoomEvent.js';
import { heartbeat } from '../../domain/multiplayer/heartbeat.js';
import { retryDelay } from '../../domain/network/retry.js';
import type { Command } from '../../domain/multiplayer/protocol.js';

export interface ConnectionSocket {
  readonly readyState: number;
  send(data: string): void;
  close(): void;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
}
export interface RoomCallbacks {
  status(connected: boolean): void;
  message(data: string): void;
  closed(code: number, reason: string, retrying: boolean): void;
}

export class RoomConnection {
  private socket: ConnectionSocket | null = null;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private probe: ReturnType<typeof setTimeout> | null = null;
  private burst: ReturnType<typeof setTimeout>[] = [];
  private lastReceived = 0;
  private retries = 0;
  private stopped = false;
  private openedAt = 0;
  private syncedAt = -Infinity;
  constructor(
    private readonly url: string,
    private readonly callbacks: RoomCallbacks,
    private readonly createSocket: (url: string) => ConnectionSocket = (url) => new WebSocket(url),
    private readonly available = () => navigator.onLine !== false,
  ) {}
  start() {
    if (!this.available()) return;
    this.open();
    this.heartbeat = setInterval(() => this.wake(), heartbeat.intervalMs);
  }
  send(command: Command) {
    if (this.socket?.readyState !== 1) return false;
    this.socket.send(JSON.stringify(command));
    return true;
  }
  wake(resync = false) {
    if (this.stopped) return;
    if (!this.available()) {
      this.suspend();
      return;
    }
    if (this.retry) return;
    if (!this.heartbeat) this.heartbeat = setInterval(() => this.wake(), heartbeat.intervalMs);
    if (Date.now() - this.lastReceived >= 90000 || !this.socket || this.socket.readyState >= 2) {
      if (this.retry) clearTimeout(this.retry);
      this.retry = null;
      this.callbacks.status(false);
      this.open();
    } else {
      if (resync && Date.now() - this.syncedAt >= 1000) {
        this.send({ type: 'sync' });
        this.synchronize();
        if (!this.probe)
          this.probe = setTimeout(() => {
            this.probe = null;
            this.callbacks.status(false);
            this.open();
          }, 30000);
      }
      if (!resync && this.socket?.readyState === 1) this.socket.send(heartbeat.request);
    }
  }
  synchronize() {
    if (this.socket?.readyState !== 1 || Date.now() - this.syncedAt < 1000) return;
    this.syncedAt = Date.now();
    this.burst.forEach(clearTimeout);
    const ping = () =>
      this.send({ type: 'ping', sent: performance.timeOrigin + performance.now() });
    ping();
    this.burst = [200, 500].map((delay) => setTimeout(ping, delay));
  }
  private open() {
    this.release();
    this.lastReceived = Date.now();
    const socket = this.createSocket(this.url);
    this.socket = socket;
    socket.onopen = () => {
      if (this.socket !== socket) return;
      this.callbacks.status(true);
      this.openedAt = Date.now();
      this.syncedAt = -Infinity;
      this.synchronize();
    };
    socket.onmessage = (event) => {
      if (this.socket !== socket || typeof event.data !== 'string') return;
      this.lastReceived = Date.now();
      if (this.probe && readRoomEvent(event.data).event?.type === 'state') {
        clearTimeout(this.probe);
        this.probe = null;
      }
      if (Date.now() - this.openedAt >= 30000) this.retries = 0;
      if (event.data !== heartbeat.response) this.callbacks.message(event.data);
    };
    socket.onerror = () => socket.close();
    socket.onclose = (event) => {
      if (this.socket !== socket) return;
      this.release();
      this.callbacks.status(false);
      const retrying = ![1008, 4000, 4001, 4003, 4004].includes(event.code);
      if (!retrying) this.close();
      this.callbacks.closed(event.code, event.reason, retrying);
      if (retrying && !this.available()) this.clearTimers();
      if (retrying && this.available()) {
        this.retry = setTimeout(
          () => {
            this.retry = null;
            if (!this.available()) {
              this.suspend();
              return;
            }
            this.open();
          },
          retryDelay(this.retries++, 1000),
        );
      }
    };
  }
  private release() {
    if (this.probe) clearTimeout(this.probe);
    this.probe = null;
    this.burst.forEach(clearTimeout);
    this.burst = [];
    const socket = this.socket;
    this.socket = null;
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onclose = null;
      socket.onerror = null;
      socket.close();
    }
  }
  suspend() {
    if (this.stopped) return;
    this.clearTimers();
    this.release();
    this.callbacks.status(false);
  }
  private clearTimers() {
    if (this.retry) clearTimeout(this.retry);
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.retry = null;
    this.heartbeat = null;
  }
  leave() {
    const endpoint = new URL(this.url);
    endpoint.protocol = endpoint.protocol === 'wss:' ? 'https:' : 'http:';
    endpoint.pathname += '/leave';
    const token = endpoint.searchParams.get('token');
    const connectionId = endpoint.searchParams.get('connectionId');
    endpoint.search = '';
    if (this.socket?.readyState !== 1 && token && connectionId)
      navigator.sendBeacon(
        endpoint.href,
        new Blob([JSON.stringify({ token, connectionId })], { type: 'application/json' }),
      );
    this.send({ type: 'leave' });
    this.close();
  }
  close() {
    this.stopped = true;
    this.clearTimers();
    this.release();
  }
}
