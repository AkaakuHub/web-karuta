import { disconnectPlayer, kickPlayer } from '../../domain/multiplayer/participants.js';
import type { RoomView } from '../../domain/multiplayer/protocol.js';
import { boardCapacity } from '../../domain/game/boardLayout.js';
import type { DurableObjectState, WebSocket as RoomSocket } from '@cloudflare/workers-types';
import { z } from 'zod';
import { roomPatch } from '../../domain/multiplayer/transport.js';
import { commandSchema } from '../../domain/multiplayer/protocol.js';
import {
  beginGame,
  claimCard,
  emptyRoom,
  prepareRound,
  readyPlayer,
  skipRound,
} from '../../domain/multiplayer/room.js';
import type { Room } from '../../domain/multiplayer/room.js';
export interface RoomContent {
  deckIds(id: string): string[];
  audioFor(cardId: string, round: number): string;
}

declare const WebSocketPair: typeof import('@cloudflare/workers-types').WebSocketPair;
const attachmentSchema = z.object({
  id: z.string(),
  last: z.number(),
  ping: z.number(),
  rtt: z.number(),
});
const joinSchema = z.object({
  token: z.uuid(),
  name: z.string().trim().min(1).max(24),
});
const unsupportedRoom = '取得者の記録に未対応の部屋です。新しい部屋を作成してください。';
const lifetime = 24 * 60 * 60 * 1000;
export class GameRoom {
  private room: Room | null = null;
  private tokens: Record<string, string | null> = {};
  private kickedTokens: Record<string, string[]> = {};
  private expiresAt = 0;
  constructor(
    private readonly ctx: DurableObjectState,
    private readonly content: RoomContent,
  ) {
    ctx.blockConcurrencyWhile(async () => {
      const [room, tokens, kickedTokens, expiresAt] = await Promise.all([
        ctx.storage.get<Room>('room'),
        ctx.storage.get<Record<string, string | null>>('tokens'),
        ctx.storage.get<Record<string, string[]>>('kickedTokens'),
        ctx.storage.getAlarm(),
      ]);
      this.room = room ?? null;
      this.tokens = tokens ?? {};
      this.kickedTokens = kickedTokens ?? {};
      this.expiresAt = expiresAt ?? 0;
    });
  }
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname.endsWith('/create')) {
      if (this.room) return Response.json({ error: '部屋が既にあります' }, { status: 409 });
      this.room = emptyRoom('');
      await this.save();
      return Response.json({ created: true });
    }
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket')
      return new Response('WebSocketが必要です', { status: 426 });
    if (!this.room) return this.rejectJoin('部屋が存在しないか期限切れです');
    if (!Object.hasOwn(this.room, 'results')) return this.rejectJoin(unsupportedRoom);
    const parsed = joinSchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return this.rejectJoin('参加情報が不正です');
    const { token, name } = parsed.data;
    const previous = this.view(this.room);
    let id = this.tokens[token];
    if (id === null) return this.rejectJoin('ホストによって退出しました');
    const newPlayer = !id;
    if (!id) {
      const active = new Set(Object.values(this.tokens));
      if (this.room.players.filter((player) => active.has(player.id)).length >= 8)
        return this.rejectJoin('部屋が満員です');
      id = crypto.randomUUID();
      this.tokens[token] = id;
      this.room = {
        ...this.room,
        players: [...this.room.players, { id, name, score: 0, connected: true }],
      };
    }
    for (const socket of this.ctx.getWebSockets(id)) socket.close(4001, '別の接続に切り替えました');
    const player = this.room.players.find((player) => player.id === id);
    if (!player) return this.rejectJoin('参加者が存在しません');
    this.room = {
      ...this.room,
      players: this.room.players.map((player) =>
        player.id === id ? { ...player, connected: true } : player,
      ),
    };
    if (!this.room.players.some((player) => player.id === this.room?.host && player.connected))
      this.room = { ...this.room, host: id };
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1], [id]);
    pair[1].serializeAttachment({ id, last: 0, ping: 0, rtt: 0 });
    await this.save(newPlayer);
    this.broadcast(previous, pair[1]);
    const init: ResponseInit & { webSocket: RoomSocket } = { status: 101, webSocket: pair[0] };
    return new Response(null, init);
  }
  async webSocketMessage(socket: RoomSocket, message: string | ArrayBuffer) {
    if (this.room && !Object.hasOwn(this.room, 'results')) {
      socket.close(1008, unsupportedRoom);
      return;
    }
    if (!this.room || typeof message !== 'string' || message.length > 1024) {
      socket.close(1008, '不正な通信です');
      return;
    }
    const identity = attachmentSchema.parse(socket.deserializeAttachment());
    if (!Object.values(this.tokens).includes(identity.id)) {
      socket.close(4003, 'ホストによって退出しました');
      return;
    }
    let input: unknown;
    try {
      input = JSON.parse(message);
    } catch {
      return;
    }
    const parsed = commandSchema.safeParse(input);
    if (!parsed.success) return;
    const command = parsed.data;
    const now = Date.now();
    if (command.type === 'sync') {
      socket.send(JSON.stringify({ type: 'state', you: identity.id, room: this.view(this.room) }));
      return;
    }
    if (command.type === 'ping') {
      if (now - identity.ping < 100) return;
      socket.serializeAttachment({ ...identity, ping: now });
      socket.send(JSON.stringify({ type: 'pong', sent: command.sent, now }));
      return;
    }
    if ('round' in command && command.round !== this.room.round) return;
    if (command.type === 'take') {
      if (now - identity.last < 40) return;
      socket.serializeAttachment({ ...identity, last: now });
    }
    try {
      const previous = this.room;
      const previousView = this.view(previous);
      if (['start', 'next', 'skip'].includes(command.type) && identity.id !== this.room.host)
        throw new Error('部屋を作った人が操作します');
      if (command.type === 'start') {
        this.room = beginGame(
          this.room,
          this.content.deckIds(command.deckId),
          boardCapacity,
          Math.random,
        );
      }
      if (command.type === 'start') this.room.deckId = command.deckId;
      if (command.type === 'next') this.room = prepareRound(this.room);
      if (command.type === 'skip') this.room = skipRound(this.room, now);
      if (command.type === 'ready') {
        socket.send(JSON.stringify({ type: 'pong', sent: command.sent, now }));
        socket.serializeAttachment({ ...identity, rtt: command.rtt });
        this.room = readyPlayer(this.room, identity.id, this.startTime(now));
      }
      if (command.type === 'kick') {
        if (!Object.values(this.tokens).includes(command.playerId))
          throw new Error('この参加者は退出済みです');
        this.room = kickPlayer(this.room, identity.id, command.playerId, now);
        for (const [token, player] of Object.entries(this.tokens)) {
          if (player === command.playerId) {
            this.kickedTokens[player] = [...(this.kickedTokens[player] ?? []), token];
            this.tokens[token] = null;
          }
        }
        for (const connection of this.ctx.getWebSockets(command.playerId))
          connection.close(4003, 'ホストによって退出しました');
      }
      if (command.type === 'unkick') {
        if (identity.id !== this.room.host) throw new Error('ホストが操作します');
        const tokens = this.kickedTokens[command.playerId];
        if (!tokens?.length) throw new Error('この参加者のキックは解除できません');
        for (const token of tokens) this.tokens[token] = command.playerId;
        delete this.kickedTokens[command.playerId];
        this.room = { ...this.room };
      }
      if (command.type === 'take') this.room = claimCard(this.room, identity.id, command.id, now);
      if (this.room === previous) return;
      await this.save(command.type === 'kick' || command.type === 'unkick');
      this.broadcast(previousView);
    } catch (error) {
      socket.send(
        JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : '操作できません',
        }),
      );
    }
  }
  async webSocketClose(socket: RoomSocket) {
    socket.close();
    if (!this.room) return;
    const { id } = attachmentSchema.parse(socket.deserializeAttachment());
    if (this.ctx.getWebSockets(id).some((other) => other !== socket && other.readyState === 1))
      return;
    if (!this.room.players.some((player) => player.id === id && player.connected)) return;
    const previous = this.view(this.room);
    this.room = disconnectPlayer(this.room, id, this.startTime(Date.now()));
    await this.save();
    this.broadcast(previous);
  }

  async webSocketError(socket: RoomSocket) {
    await this.webSocketClose(socket);
  }
  async alarm() {
    for (const socket of this.ctx.getWebSockets()) socket.close(4000, '部屋の期限が切れました');
    this.room = null;
    this.tokens = {};
    this.kickedTokens = {};
    await this.ctx.storage.deleteAll();
  }
  private startTime(now: number) {
    const rtts = this.ctx
      .getWebSockets()
      .filter((socket) => socket.readyState === 1)
      .map((socket) => attachmentSchema.parse(socket.deserializeAttachment()).rtt);
    return now + 250 + Math.max(0, ...rtts);
  }
  private rejectJoin(message: string) {
    const pair = new WebSocketPair();
    pair[1].accept();
    pair[1].send(JSON.stringify({ type: 'error', message }));
    pair[1].close(1008, '参加できません');
    const init: ResponseInit & { webSocket: RoomSocket } = { status: 101, webSocket: pair[0] };
    return new Response(null, init);
  }
  private async save(includeTokens = false) {
    await this.ctx.storage.put(
      includeTokens
        ? { room: this.room, tokens: this.tokens, kickedTokens: this.kickedTokens }
        : { room: this.room },
    );
    const now = Date.now();
    if (this.expiresAt - now < lifetime / 2) {
      this.expiresAt = now + lifetime;
      await this.ctx.storage.setAlarm(this.expiresAt);
    }
  }
  private view(value: Room) {
    const { order, ...room } = value;
    const answer = order[room.round] ?? null;
    const active = new Set(Object.values(this.tokens));
    return {
      ...room,
      players: room.players.map((player) => ({
        ...player,
        removed: !active.has(player.id),
      })),
      total: order.length,
      answer: room.phase === 'revealed' ? answer : null,
      audio:
        ['loading', 'playing', 'revealed'].includes(room.phase) && answer
          ? this.content.audioFor(answer, room.round)
          : null,
    };
  }
  private broadcast(previous?: RoomView, initialSocket?: RoomSocket) {
    if (!this.room) return;
    const view = this.view(this.room);
    const update = previous
      ? JSON.stringify({ type: 'update', room: roomPatch(previous, view) })
      : null;
    for (const socket of this.ctx.getWebSockets()) {
      const { id } = attachmentSchema.parse(socket.deserializeAttachment());
      if (socket.readyState === 1)
        socket.send(
          (socket === initialSocket ? null : update) ??
            JSON.stringify({ type: 'state', you: id, room: view }),
        );
    }
  }
}
