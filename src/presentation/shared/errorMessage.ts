export function errorMessage(reason: unknown, message: string): string {
  return reason instanceof Error ? reason.message : message;
}
