const RETRY_DELAYS_MINUTES = [1, 5, 15];

export function nextNotificationRetry(attemptCount: number, now = new Date()): { attemptCount: number; nextRetryAt?: string } {
  const nextAttempt = Math.max(0, Math.floor(attemptCount)) + 1;
  const delay = RETRY_DELAYS_MINUTES[nextAttempt - 1];
  if (delay == null) return { attemptCount: nextAttempt };
  return { attemptCount: nextAttempt, nextRetryAt: new Date(now.getTime() + delay * 60_000).toISOString() };
}
