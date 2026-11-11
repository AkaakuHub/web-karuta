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
    spectators: room.spectators.map((person) =>
      person.id === id ? { ...person, connected: false } : person,
    ),
    players: room.players.map((player) =>
      player.id === id ? { ...player, connected: false } : player,
    ),
    ready: room.ready.filter((player) => player !== id),
  };
  if (id === next.host)
    next = { ...next, host: next.players.find((player) => player.connected)?.id ?? '' };
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

export function joinParticipant(room: Room, id: string, name: string, spectator: boolean): Room {
  if (spectator) {
    const existing = room.spectators.some((person) => person.id === id);
    return {
      ...room,
      spectators: existing
        ? room.spectators.map((person) =>
            person.id === id ? { ...person, connected: true } : person,
          )
        : [...room.spectators, { id, name, connected: true }],
    };
  }
  if (room.spectators.some((person) => person.id === id))
    throw new Error('閲覧者はプレイヤーに変更できません');
  const existing = room.players.some((person) => person.id === id);
  return {
    ...room,
    host: room.players.some((person) => person.id === room.host && person.connected)
      ? room.host
      : id,
    players: existing
      ? room.players.map((person) => (person.id === id ? { ...person, connected: true } : person))
      : [...room.players, { id, name, score: 0, connected: true }],
  };
}

export function leaveParticipant(room: Room, id: string, now: number): Room {
  const disconnected = disconnectPlayer(room, id, now);
  return {
    ...disconnected,
    players: disconnected.players.filter(
      (person) => person.id !== id || room.results.some((result) => result.owner === id),
    ),
    spectators: disconnected.spectators.filter((person) => person.id !== id),
  };
}

export function canCommand(room: Room, id: string, type: string): boolean {
  if (['ping', 'sync', 'leave'].includes(type)) return true;
  if (!room.players.some((player) => player.id === id && player.connected)) return false;
  return !['start', 'next', 'skip', 'kick', 'unkick'].includes(type) || room.host === id;
}
