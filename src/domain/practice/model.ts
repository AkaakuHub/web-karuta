import { z } from 'zod';
import { Rating, type DefaultScheduler } from 'ts-fsrs';

const recordSchema = z.object({
  card: z.object({
    cardId: z.string(),
    stability: z.number().nonnegative(),
    stabilityFast: z.number().nonnegative(),
    difficulty: z.number().nonnegative(),
    state: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
    scheduleStatus: z.enum(['new', 'learning', 'review']),
    dueAt: z.coerce.date(),
    lastReviewAt: z.coerce.date().nullable(),
    reps: z.number().int().nonnegative(),
    lapses: z.number().int().nonnegative(),
    scheduledDays: z.number().nonnegative(),
    learningStep: z.number().int().nonnegative().optional(),
  }),
  successes: z.number().int().nonnegative(),
  misses: z.number().int().nonnegative(),
  lastCorrect: z.boolean(),
});
export const practiceSchema = z.record(z.string(), recordSchema);
export type PracticeRecords = z.infer<typeof practiceSchema>;
export const practiceModeSchema = z.enum(['all', 'due', 'failed', 'weak']);
export type PracticeMode = z.infer<typeof practiceModeSchema>;

export function matchesPractice(
  record: PracticeRecords[string] | undefined,
  mode: PracticeMode,
  now: Date,
) {
  if (mode === 'all') return true;
  if (!record) return false;
  if (mode === 'due') return record.card.dueAt <= now;
  if (mode === 'failed') return !record.lastCorrect;
  return record.misses > 0 && (record.card.state !== 2 || record.successes <= record.misses);
}

export function reviewPractice(
  scheduler: DefaultScheduler,
  previous: PracticeRecords[string] | undefined,
  songId: string,
  correct: boolean,
  now: Date,
): PracticeRecords[string] {
  const card = previous?.card ?? scheduler.newCard({ cardId: songId, now });
  return {
    card: {
      ...scheduler.review({ card, grade: correct ? Rating.Good : Rating.Again, now }).card,
      cardId: songId,
    },
    successes: (previous?.successes ?? 0) + Number(correct),
    misses: (previous?.misses ?? 0) + Number(!correct),
    lastCorrect: correct,
  };
}
