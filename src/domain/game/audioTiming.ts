export function audibleReactionMs(
  outputContextTime: number,
  startedAt: number,
  offset: number,
): number {
  return (outputContextTime - startedAt + offset) * 1000;
}
