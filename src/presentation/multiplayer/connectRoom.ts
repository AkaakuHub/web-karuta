import { v4 } from 'uuid';
import {
  RoomConnection,
  type RoomCallbacks,
} from '../../infrastructure/multiplayer/roomConnection.js';

export function connectRoom(
  id: string,
  name: string,
  spectator: boolean,
  storagePrefix: string,
  callbacks: RoomCallbacks,
) {
  const key = `${storagePrefix}-room:${id}`;
  const token = sessionStorage.getItem(key) ?? v4();
  sessionStorage.setItem(key, token);
  const endpoint = new URL(`/api/rooms/${id}`, location.href);
  endpoint.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  endpoint.searchParams.set('token', token);
  endpoint.searchParams.set('spectator', String(spectator));
  endpoint.searchParams.set('connectionId', v4());
  endpoint.searchParams.set('name', name.trim());
  return new RoomConnection(endpoint.href, callbacks);
}
