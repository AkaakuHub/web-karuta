import { z } from 'zod';
import { roundResultSchema } from '../game/results.js';

export const commandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ping'), sent: z.number() }),
  z.object({ type: z.literal('sync') }),
  z.object({
    type: z.literal('start'),
    deckId: z.string().min(1).max(32),
  }),
  z.object({
    type: z.literal('ready'),
    round: z.number().int(),
    sent: z.number(),
    rtt: z.number().min(0).max(10000),
  }),
  z.object({ type: z.literal('take'), round: z.number().int(), id: z.string().max(150) }),
  z.object({ type: z.literal('next'), round: z.number().int().nonnegative() }),
  z.object({ type: z.literal('skip'), round: z.number().int().nonnegative() }),
  z.object({ type: z.literal('kick'), playerId: z.uuid() }),
  z.object({ type: z.literal('unkick'), playerId: z.uuid() }),
]);
export type Command = z.infer<typeof commandSchema>;
const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  score: z.number(),
  connected: z.boolean(),
  removed: z.boolean(),
});
const roomViewSchema = z.object({
  host: z.string(),
  deckId: z.string().nullable(),
  players: z.array(playerSchema),
  board: z.array(z.string().nullable()),
  phase: z.enum(['lobby', 'loading', 'playing', 'revealed', 'finished']),
  round: z.number(),
  total: z.number(),
  startsAt: z.number().nullable(),
  audio: z.string().nullable(),
  answer: z.string().nullable(),
  winner: z.string().nullable(),
  blocked: z.array(z.string()),
  ready: z.array(z.string()),
  results: z.array(roundResultSchema),
});
export const roomPatchSchema = roomViewSchema.partial().extend({
  boardSlots: z
    .array(z.object({ slot: z.number().int().nonnegative(), id: z.string().nullable() }))
    .optional(),
  resultsAppend: z.array(roundResultSchema).optional(),
});
export type RoomPatch = z.infer<typeof roomPatchSchema>;
export type RoomView = z.infer<typeof roomViewSchema>;
export const eventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('state'), you: z.string(), room: roomViewSchema }),
  z.object({ type: z.literal('update'), room: roomPatchSchema }),
  z.object({ type: z.literal('pong'), sent: z.number(), now: z.number() }),
  z.object({ type: z.literal('error'), message: z.string() }),
]);
