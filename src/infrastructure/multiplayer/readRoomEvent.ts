import { eventSchema } from '../../domain/multiplayer/protocol.js';

export function readRoomEvent(data: string) {
  let input: unknown;
  try {
    input = JSON.parse(data);
  } catch {
    return { event: null, error: '対戦データを読み込めません' };
  }
  const parsed = eventSchema.safeParse(input);
  return parsed.success
    ? { event: parsed.data, error: '' }
    : { event: null, error: '対戦データの形式が一致しません' };
}
