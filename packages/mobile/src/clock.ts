/**
 * The clock lives here — at the edge — and never inside @koi/domain.
 *
 * A civil date is what the domain works with: a `YYYY-MM-DD` string with no
 * timezone attached, because "the 12 June fill" is the same fact whether you read
 * it in Madrid or Tokyo. Turning *now* into one of those is inherently local and
 * inherently impure, so it happens here and is passed in as input.
 */

const pad = (n: number): string => String(n).padStart(2, '0');

/** Today, as the user's calendar sees it (local, not UTC). */
export function todayCivil(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** An instant, for the review-queue latch. The server overwrites it with its own. */
export const nowIso = (now: Date = new Date()): string => now.toISOString();
