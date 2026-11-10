import { roomPatchSchema } from './protocol.js';
import type { RoomPatch, RoomView } from './protocol.js';

export function roomPatch(previous: RoomView, next: RoomView): RoomPatch {
  const patch = roomPatchSchema.parse(
    Object.fromEntries(
      Object.entries(next).filter(
        ([key, value]) =>
          key !== 'board' &&
          key !== 'results' &&
          JSON.stringify(value) !== JSON.stringify(Reflect.get(previous, key)),
      ),
    ),
  );
  if (previous.board.length !== next.board.length) patch.board = next.board;
  else {
    const slots = next.board.flatMap((id, slot) =>
      id === previous.board[slot] ? [] : [{ slot, id }],
    );
    if (slots.length) patch.boardSlots = slots;
  }
  if (
    previous.results.every(
      (result, index) =>
        next.results[index]?.id === result.id && next.results[index]?.owner === result.owner,
    )
  ) {
    const added = next.results.slice(previous.results.length);
    if (added.length) patch.resultsAppend = added;
  } else patch.results = next.results;
  return patch;
}

export function applyRoomPatch(previous: RoomView, update: RoomPatch): RoomView {
  const { boardSlots, resultsAppend, ...patch } = update;
  const slots = new Map(boardSlots?.map(({ slot, id }) => [slot, id]));
  return {
    ...previous,
    ...patch,
    board:
      patch.board ??
      (slots.size
        ? previous.board.map((id, slot) => (slots.has(slot) ? slots.get(slot)! : id))
        : previous.board),
    results:
      patch.results ?? (resultsAppend ? previous.results.concat(resultsAppend) : previous.results),
  };
}
