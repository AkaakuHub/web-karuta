import type { DurableObjectState } from '@cloudflare/workers-types';
import { z } from 'zod';
export interface RoomContent {
  deckIds(id: string): string[];
  audioFor(cardId: string, round: number): string;
}

export const attachmentSchema = z.object({
  id: z.string(),
  connectionId: z.uuid(),
  spectator: z.boolean(),
  last: z.number(),
  ping: z.number(),
  samples: z.array(z.number().nonnegative()),
  probe: z.object({ id: z.uuid(), sent: z.number() }).nullable(),
  lastProbe: z.number(),
});
export const joinSchema = z.object({
  token: z.uuid(),
  connectionId: z.uuid(),
  spectator: z.enum(['true', 'false']).transform((value) => value === 'true'),
  name: z.string().trim().min(1).max(24),
});
export const unsupportedRoom = '部屋の形式が異なります。新しい部屋を作成してください。';
export const leaveSchema = z.object({ token: z.uuid(), connectionId: z.uuid() });

export interface RoomContext extends Pick<
  DurableObjectState,
  'blockConcurrencyWhile' | 'getWebSockets' | 'acceptWebSocket' | 'setWebSocketAutoResponse'
> {
  storage: Pick<
    DurableObjectState['storage'],
    'get' | 'put' | 'getAlarm' | 'setAlarm' | 'deleteAll'
  >;
}
