import {
  canCommand,
  disconnectPlayer,
  joinParticipant,
  kickPlayer,
  leaveParticipant,
} from '../../domain/multiplayer/participants.js';
import { removeMembership, type Memberships } from '../../domain/multiplayer/membership.js';
import type { RoomView } from '../../domain/multiplayer/protocol.js';
import { boardCapacity } from '../../domain/game/boardLayout.js';
import type { DurableObjectState, WebSocket as RoomSocket } from '@cloudflare/workers-types';
import {
  attachmentSchema,
  joinSchema,
  leaveSchema,
  unsupportedRoom,
  type RoomContent,
} from './roomIdentity.js';
import { publicRoom } from './roomView.js';
export type { RoomContent } from './roomIdentity.js';
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
declare const WebSocketPair: typeof import('@cloudflare/workers-types').WebSocketPair;
const lifetime = 24 * 60 * 60 * 1000;
export class GameRoom {
  private room: Room | null = null;
  private tokens: Memberships = {};
  private kickedTokens: Record<string, string[]> = {};
  private expiresAt = 0;
  constructor(
    private readonly ctx: DurableObjectState,
    private readonly content: RoomContent,
  ) {
    ctx.blockConcurrencyWhile(async () => {
      const [room, tokens, kickedTokens, expiresAt] = await Promise.all([
        ctx.storage.get<Room>('room'),
        ctx.storage.get<Memberships>('tokens'),
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
    if (request.method === 'POST' && url.pathname.endsWith('/leave')) {
      const parsed = leaveSchema.safeParse(await request.json());
      if (parsed.success) await this.leave(parsed.data.token, parsed.data.connectionId);
      return new Response(null, { status: 204 });
    }
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket')
      return new Response('WebSocketが必要です', { status: 426 });
    if (!this.room) return this.rejectJoin('部屋が存在しないか期限切れです');
    if (!Object.hasOwn(this.room, 'spectators')) return this.rejectJoin(unsupportedRoom);
    const parsed = joinSchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return this.rejectJoin('参加情報が不正です');
    const { token, name, spectator, connectionId } = parsed.data;
    const previous = this.view(this.room);
    const member = this.tokens[token];
    if (member === null) return this.rejectJoin('ホストによって退出しました');
    if (member && member.spectator !== spectator)
      return this.rejectJoin('退出してから参加方法を変更してください');
    if (!member) {
      const count = Object.values(this.tokens).filter(
        (person) => person?.spectator === spectator,
      ).length;
      if (count >= (spectator ? 32 : 8)) return this.rejectJoin('部屋が満員です');
    }
    const id = member?.id ?? crypto.randomUUID();
    this.tokens[token] = { id, spectator, connectionId };
    for (const socket of this.ctx.getWebSockets(id)) socket.close(4001, '別の接続に切り替えました');
    this.room = joinParticipant(this.room, id, name, spectator);
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1], [id]);
    pair[1].serializeAttachment({ id, connectionId, spectator, last: 0, ping: 0, rtt: 0 });
    await this.save(true);
    this.broadcast(previous, pair[1]);
    const init: ResponseInit & { webSocket: RoomSocket } = { status: 101, webSocket: pair[0] };
    return new Response(null, init);
  }
  async webSocketMessage(socket: RoomSocket, message: string | ArrayBuffer) {
    if (this.room && !Object.hasOwn(this.room, 'spectators')) {
      socket.close(1008, unsupportedRoom);
      return;
    }
    if (!this.room || typeof message !== 'string' || message.length > 1024) {
      socket.close(1008, '不正な通信です');
      return;
    }
    const identity = attachmentSchema.parse(socket.deserializeAttachment());
    if (
      !Object.values(this.tokens).some(
        (person) => person?.id === identity.id && person.connectionId === identity.connectionId,
      )
    ) {
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
    if (command.type === 'leave') {
      const entry = Object.entries(this.tokens).find(([, person]) => person?.id === identity.id);
      if (entry) await this.leave(entry[0], identity.connectionId);
      return;
    }
    if (!canCommand(this.room, identity.id, command.type)) {
      socket.send(JSON.stringify({ type: 'error', message: 'この操作の権限がありません' }));
      return;
    }
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
        if (!Object.values(this.tokens).some((person) => person?.id === command.playerId))
          throw new Error('この参加者は退出済みです');
        this.room = kickPlayer(this.room, identity.id, command.playerId, now);
        for (const [token, player] of Object.entries(this.tokens)) {
          if (player?.id === command.playerId) {
            this.kickedTokens[player.id] = [...(this.kickedTokens[player.id] ?? []), token];
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
        for (const token of tokens)
          this.tokens[token] = {
            id: command.playerId,
            spectator: false,
            connectionId: crypto.randomUUID(),
          };
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
    if (
      ![...this.room.players, ...this.room.spectators].some(
        (person) => person.id === id && person.connected,
      )
    )
      return;
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
  private async leave(token: string, connectionId: string) {
    const member = this.tokens[token];
    const tokens = removeMembership(this.tokens, token, connectionId);
    if (!this.room || !member || tokens === this.tokens) return;
    const previous = this.view(this.room);
    this.tokens = tokens;
    this.room = leaveParticipant(this.room, member.id, this.startTime(Date.now()));
    await this.save(true);
    this.broadcast(previous);
    for (const socket of this.ctx.getWebSockets(member.id))
      socket.close(4004, '部屋から退出しました');
  }
  private startTime(now: number) {
    const rtts = this.ctx
      .getWebSockets()
      .filter((socket) => socket.readyState === 1)
      .map((socket) => attachmentSchema.parse(socket.deserializeAttachment()))
      .filter((identity) => !identity.spectator)
      .map((identity) => identity.rtt);
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
    return publicRoom(value, this.tokens, this.content);
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
