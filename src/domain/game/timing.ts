import type { GameSession } from './session.js';

export function pauseQuestion(session: GameSession, now: number): GameSession {
  if (session.phase !== 'playing' || session.startedAt === null) return session;
  const elapsed = Math.max(0, now - session.startedAt);
  return {
    ...session,
    elapsedMs: session.elapsedMs + elapsed,
    roundElapsedMs: session.roundElapsedMs + elapsed,
    startedAt: null,
  };
}

export function resumeQuestion(session: GameSession, now: number): GameSession {
  return session.phase === 'playing' && session.startedAt === null
    ? { ...session, startedAt: now }
    : session;
}

export function elapsedTime(session: GameSession, now: number): number {
  return (
    session.elapsedMs +
    (session.phase === 'playing' && session.startedAt !== null
      ? Math.max(0, now - session.startedAt)
      : 0)
  );
}
