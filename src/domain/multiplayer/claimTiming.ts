export const claimTiming = {
  maxCompensationMs: 1500,
  inputDispatchMs: 150,
  clockToleranceMs: 50,
} as const;

export interface TimedClaim {
  playerId: string;
  elapsedMs: number;
}

export function claimAllowance(rtts: readonly number[]): number {
  if (rtts.length < 2) throw new Error('通信時間の測定が完了していません');
  const minimum = Math.min(...rtts);
  const maximum = Math.max(...rtts);
  return Math.min(
    claimTiming.maxCompensationMs,
    maximum / 2 + (maximum - minimum) + claimTiming.inputDispatchMs,
  );
}

export function validClaimTime(
  elapsedMs: number,
  startsAt: number,
  receivedAt: number,
  allowanceMs: number,
): boolean {
  const age = receivedAt - startsAt - elapsedMs;
  return (
    Number.isFinite(elapsedMs) &&
    elapsedMs >= 0 &&
    receivedAt >= startsAt &&
    age >= -claimTiming.clockToleranceMs &&
    age <= allowanceMs
  );
}

export function winningClaim(claims: readonly TimedClaim[], random: () => number): string | null {
  if (!claims.length) return null;
  const earliest = Math.min(...claims.map((claim) => claim.elapsedMs));
  const first = claims.filter((claim) => claim.elapsedMs === earliest);
  return first[Math.floor(random() * first.length)]!.playerId;
}
