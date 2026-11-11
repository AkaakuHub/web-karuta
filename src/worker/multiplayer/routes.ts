import { v7 as uuidv7 } from 'uuid';
import type { DurableObjectId } from '@cloudflare/workers-types';

export interface RoomBinding {
  idFromName(name: string): DurableObjectId;
  get(
    id: DurableObjectId,
    options: { locationHint: 'apac' },
  ): {
    fetch(request: Request): Promise<Response>;
  };
}

export async function routeRoom(request: Request, rooms: RoomBinding): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname === '/api/rooms' && request.method === 'POST') {
    const id = uuidv7();
    const room = rooms.get(rooms.idFromName(id), { locationHint: 'apac' });
    const result = await room.fetch(
      new Request(new URL(`/api/rooms/${id}/create`, url), { method: 'POST' }),
    );
    if (!result.ok) return new Response('部屋を作成できません', { status: 503 });
    return Response.json({ id }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  }
  const roomId = /^\/api\/rooms\/([a-f\d-]{36})(?:\/leave)?$/u.exec(url.pathname)?.[1];
  if (roomId && (request.method === 'GET' || request.method === 'POST'))
    return rooms.get(rooms.idFromName(roomId), { locationHint: 'apac' }).fetch(request);
  return null;
}
