import type { Room } from './room.js';

export function preparationDeadline(room: Room | null, current: number, now: number): number {
  if (room?.phase !== 'loading') return 0;
  const deadline = current || now + 60000;
  return room.ready.length ? Math.min(deadline, now + 15000) : deadline;
}
