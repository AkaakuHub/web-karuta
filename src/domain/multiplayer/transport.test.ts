import { describe, expect, it } from 'vite-plus/test';
import { applyRoomPatch, roomPatch } from './transport.js';
import { emptyRoom } from './room.js';
import type { RoomView } from './protocol.js';

const initial: RoomView = {
  ...emptyRoom('a'),
  players: [],
  total: 0,
  audio: null,
  answer: null,
  results: [],
};
describe('部屋の差分配信', () => {
  it('変化がない場合は送信する項目がない', () => {
    expect(roomPatch(initial, initial)).toEqual({});
  });
  it('盤面と履歴を送り直さず開始状態を復元する', () => {
    const next: RoomView = { ...initial, phase: 'playing', startsAt: 100 };
    const patch = roomPatch(initial, next);
    expect(patch).toEqual({ phase: 'playing', startsAt: 100 });
    expect(applyRoomPatch(initial, patch)).toEqual(next);
  });
  it('取得済み札は追加分だけで復元する', () => {
    const before = { ...initial, results: [{ id: 'one', owner: 'a' }] };
    const next = {
      ...before,
      results: [
        { id: 'one', owner: 'a' },
        { id: 'two', owner: null },
      ],
    };
    const patch = roomPatch(before, next);
    expect(patch).toEqual({ resultsAppend: [{ id: 'two', owner: null }] });
    expect(applyRoomPatch(before, patch)).toEqual(next);
    expect(applyRoomPatch(next, roomPatch(next, initial))).toEqual(initial);
  });
  it('札の補充と答えの削除を正しく復元する', () => {
    const before: RoomView = {
      ...initial,
      board: ['one', 'two'],
      answer: 'one',
      results: [{ id: 'one', owner: 'a' }],
    };
    const next: RoomView = { ...before, board: ['three', 'two'], answer: null };
    const patch = roomPatch(before, next);
    expect(patch).toEqual({ boardSlots: [{ slot: 0, id: 'three' }], answer: null });
    expect(applyRoomPatch(before, patch)).toEqual(next);
  });
});
