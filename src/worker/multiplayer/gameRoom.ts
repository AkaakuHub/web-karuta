import { ClaimTimer } from './claimTimer.js';
import { preparationDeadline } from '../../domain/multiplayer/preparation.js';
import { configureHeartbeat } from './roomHeartbeat.js';
import {
  canCommand,
  disconnectPlayer,
  joinParticipant,
  leaveParticipant,
  renameParticipant,
} from '../../domain/multiplayer/participants.js';
import { endMembership, type Memberships } from '../../domain/multiplayer/membership.js';
import type { RoomView } from '../../domain/multiplayer/protocol.js';
import { boardCapacity } from '../../domain/game/boardLayout.js';
import type { WebSocket as RoomSocket } from '@cloudflare/workers-types';
import {
  attachmentSchema,
  joinSchema,
  leaveSchema,
  unsupportedRoom,
  type RoomContent,
  type RoomContext,
} from './roomIdentity.js';
import { RoomPersistence, roomLifetime } from './roomPersistence.js';
import { progressRoom } from './roomProgress.js';
import { publicRoom } from './roomView.js';
export type { RoomContent } from './roomIdentity.js';
import { broadcastRoom, readRoomMessage, rejectJoin, sendRoomError } from './roomMessages.js';
import { moderateRoom } from './roomModeration.js';
import { acknowledgeProbe, probeSocket, roomClaimWindow, roundStartTime } from './roomTiming.js';
import { submitClaim, settleClaims, type ClaimRound } from '../../domain/multiplayer/claims.js';
import {
  giveUp,
  beginGame,
  finishPreparation,
  emptyRoom,
  readyPlayer,
  type Room,
} from '../../domain/multiplayer/room.js';
declare const WebSocketPair: typeof import('@cloudflare/workers-types').WebSocketPair;
export class GameRoom {
  private readonly claimTimer: ClaimTimer;
  private room: Room | null = null;
  private tokens: Memberships = {};
  private kickedTokens: Record<string, string[]> = {};
  private expiresAt = 0;
  private claims: ClaimRound | null = null;
  private loadingDeadline = 0;
  private persistence: RoomPersistence;
  constructor(
    private readonly ctx: RoomContext,
    private readonly content: RoomContent,
  ) {
    this.claimTimer = new ClaimTimer(() => ctx.blockConcurrencyWhile(() => this.settleClaims()));
    this.persistence = new RoomPersistence(ctx.storage);
    configureHeartbeat(ctx);
    ctx.blockConcurrencyWhile(async () => {
      Object.assign(this, await this.persistence.load());
      this.claimTimer.schedule(this.claims?.deadline ?? null);
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
    if (!this.room) return rejectJoin('部屋が存在しないか期限切れです');
    if (!Object.hasOwn(this.room, 'settling')) return rejectJoin(unsupportedRoom);
    const parsed = joinSchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return rejectJoin('参加情報が不正です');
    const { token, name, spectator, connectionId } = parsed.data;
    const previous = this.view(this.room);
    const member = this.tokens[token];
    if (member === null) return rejectJoin('ホストによって退出しました');
    if (member && member.spectator !== spectator)
      return rejectJoin('退出してから参加方法を変更してください');
    if (!member) {
      const count = Object.values(this.tokens).filter(
        (person) => person?.spectator === spectator,
      ).length;
      if (count >= (spectator ? 32 : 20)) return rejectJoin('部屋が満員です');
    }
    const id = member?.id ?? crypto.randomUUID();
    this.tokens[token] = { id, spectator, connectionId };
    for (const socket of this.ctx.getWebSockets(id)) socket.close(4001, '別の接続に切り替えました');
    this.room = joinParticipant(this.room, id, name, spectator);
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1], [id]);
    pair[1].serializeAttachment({
      id,
      connectionId,
      spectator,
      last: 0,
      ping: 0,
      samples: [],
      probe: null,
      lastProbe: 0,
    });
    probeSocket(pair[1], Date.now());
    await this.save(true);
    this.broadcast(previous, pair[1]);
    const init: ResponseInit & { webSocket: RoomSocket } = { status: 101, webSocket: pair[0] };
    return new Response(null, init);
  }
  async webSocketMessage(socket: RoomSocket, message: string | ArrayBuffer) {
    const input = readRoomMessage(socket, message, this.room, this.tokens);
    if (!input || !this.room) return;
    const { command, identity } = input;
    const now = Date.now();
    if (command.type === 'probeAck') {
      acknowledgeProbe(socket, command.id, now);
      return;
    }
    if (this.claims && now >= this.claims.deadline) await this.settleClaims();
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
      probeSocket(socket, now);
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
      if (command.type === 'rename')
        this.room = renameParticipant(this.room, identity.id, command.name);
      if (command.type === 'start') {
        this.room = beginGame(
          this.room,
          this.content.deckIds(command.deckId),
          boardCapacity,
          Math.random,
        );
        this.room.deckId = command.deckId;
      }

      this.room = progressRoom(this.room, command, now);
      if (command.type === 'finish') this.claims = null;
      if (command.type === 'giveUp') this.room = giveUp(this.room, identity.id);
      if (command.type === 'ready') {
        socket.send(JSON.stringify({ type: 'pong', sent: command.sent, now }));
        if (identity.samples.length < 2) {
          probeSocket(socket, now);
          return;
        }
        this.room = readyPlayer(this.room, identity.id, this.startTime(now));
      }
      if (command.type === 'kick' || command.type === 'unkick')
        this.room = moderateRoom(
          this.room,
          command,
          identity.id,
          this.tokens,
          this.kickedTokens,
          this.ctx.getWebSockets(command.playerId),
          now,
        );
      if (command.type === 'take') {
        const take = submitClaim(
          this.room,
          this.claims,
          identity.id,
          command.id,
          command.elapsedMs,
          now,
          identity.samples,
          roomClaimWindow(this.ctx.getWebSockets(), this.room.ready),
        );
        this.room = take.room;
        this.claims = take.pending;
        if (take.accepted) {
          await this.save();
          socket.send(JSON.stringify({ type: 'takeAccepted', round: this.room.round }));
          return;
        }
      }
      if (this.room === previous) return;
      await this.save(command.type === 'kick' || command.type === 'unkick');
      this.broadcast(previousView);
    } catch (error) {
      sendRoomError(socket, error);
    }
  }
  async webSocketClose(socket: RoomSocket) {
    socket.close();
    if (!this.room) return;
    const { id } = attachmentSchema.parse(socket.deserializeAttachment());
    if (this.ctx.getWebSockets(id).some((other) => other !== socket && other.readyState === 1))
      return;
    const participants = [...this.room.players, ...this.room.spectators];
    if (!participants.some((person) => person.id === id && person.connected)) return;
    const previous = this.view(this.room);
    this.room = disconnectPlayer(this.room, id, this.startTime(Date.now()));
    await this.save();
    this.broadcast(previous);
  }

  async webSocketError(socket: RoomSocket) {
    await this.webSocketClose(socket);
  }
  async alarm() {
    this.persistence.alarmFired();
    const now = Date.now();
    if (now >= this.expiresAt) {
      for (const socket of this.ctx.getWebSockets()) socket.close(4000, '部屋の期限が切れました');
      this.room = null;
      this.tokens = {};
      this.kickedTokens = {};
      this.claims = null;
      this.claimTimer.schedule(null);
      await this.persistence.clear();
    } else if (this.room && this.loadingDeadline > 0 && now >= this.loadingDeadline) {
      const previous = this.view(this.room);
      this.room = finishPreparation(this.room, this.startTime(now));
      await this.save();
      this.broadcast(previous);
    } else if (this.claims && now >= this.claims.deadline) await this.settleClaims();
    else await this.save();
  }
  private async settleClaims() {
    if (!this.room || !this.claims) return;
    const previous = this.view(this.room);
    const pending = this.claims;
    this.claims = null;
    this.room = settleClaims(
      this.room,
      pending,
      () => crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32,
    );
    await this.save();
    this.broadcast(previous);
  }
  private async leave(token: string, connectionId: string) {
    const member = this.tokens[token];
    const tokens = endMembership(this.tokens, token, connectionId);
    if (!this.room || !member || tokens === this.tokens) return;
    const previous = this.view(this.room);
    this.tokens = tokens;
    if (this.claims) {
      this.claims.entries = this.claims.entries.filter((claim) => claim.playerId !== member.id);
      if (!this.claims.entries.length) {
        this.claims = null;
        this.room = { ...this.room, settling: false };
      }
    }
    this.room = leaveParticipant(this.room, member.id, this.startTime(Date.now()));
    await this.save(true);
    this.broadcast(previous);
    for (const socket of this.ctx.getWebSockets(member.id))
      socket.close(4004, '部屋から退出しました');
  }
  private startTime(now: number) {
    return roundStartTime(now, this.ctx.getWebSockets());
  }

  private async save(includeTokens = false) {
    this.claimTimer.schedule(this.claims?.deadline ?? null);
    const now = Date.now();
    if (this.expiresAt - now < roomLifetime / 2) this.expiresAt = now + roomLifetime;
    this.loadingDeadline = preparationDeadline(this.room, this.loadingDeadline, now);
    await this.persistence.save({
      room: this.room,
      claims: this.claims,
      loadingDeadline: this.loadingDeadline,
      expiresAt: this.expiresAt,
      ...(includeTokens ? { tokens: this.tokens, kickedTokens: this.kickedTokens } : {}),
    });
  }

  private view(value: Room) {
    return publicRoom(value, this.tokens, this.content);
  }
  private broadcast(previous?: RoomView, initialSocket?: RoomSocket) {
    if (this.room)
      broadcastRoom(this.ctx.getWebSockets(), this.view(this.room), previous, initialSocket);
  }
}
