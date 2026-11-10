import { readyPlayer, revealBlockedRound, type Room } from './room.js';
import type { RoomView } from './protocol.js';

export function waitingPlayers(room: RoomView) {
  return room.phase === 'loading'
    ? room.players.filter(
        (player) => player.connected && !player.removed && !room.ready.includes(player.id),
      )
    : [];
}

export function disconnectPlayer(room: Room, id: string, now: number): Room {
  let next: Room = {
    ...room,
    players: room.players.map((player) =>
      player.id === id ? { ...player, connected: false } : player,
    ),
    ready: room.ready.filter((player) => player !== id),
  };
  if (id === next.host)
    next = { ...next, host: next.players.find((player) => player.connected)?.id ?? id };
  if (next.phase === 'loading') {
    const ready = next.players.find((player) => player.connected && next.ready.includes(player.id));
    if (ready) next = readyPlayer(next, ready.id, now);
  }
  return revealBlockedRound(next);
}

export function kickPlayer(room: Room, actor: string, target: string, now: number): Room {
  if (actor !== room.host) throw new Error('ホストだけが参加者を退出させられます');
  if (actor === target) throw new Error('自分をキックすることはできません');
  if (!room.players.some((player) => player.id === target)) throw new Error('参加者が存在しません');
  return disconnectPlayer(room, target, now);
}
