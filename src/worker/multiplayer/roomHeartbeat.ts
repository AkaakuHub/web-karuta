import { heartbeat } from '../../domain/multiplayer/heartbeat.js';
import type { RoomContext } from './roomIdentity.js';

declare const WebSocketRequestResponsePair: typeof import('@cloudflare/workers-types').WebSocketRequestResponsePair;

export function configureHeartbeat(ctx: RoomContext) {
  ctx.setWebSocketAutoResponse(
    new WebSocketRequestResponsePair(heartbeat.request, heartbeat.response),
  );
}
