export function playbackPosition(
  offset: number,
  startedAt: number | null,
  now: number,
  duration: number,
) {
  return Math.min(
    duration,
    Math.max(0, offset + (startedAt === null ? 0 : Math.max(0, now - startedAt))),
  );
}
