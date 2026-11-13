import type { Room } from './room.js';

export function preparationDeadline(room: Room | null, current: number, now: number): number {
  if (room?.phase !== 'loading' || room.ready.length === 0) return 0;
  return current || now + 15000;
}
