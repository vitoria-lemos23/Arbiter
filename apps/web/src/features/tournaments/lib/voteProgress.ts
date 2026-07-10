/**
 * Pure helpers for the judge vote progress display (spec 007). A match resolves
 * on a strict majority; with an odd panel (enforced at creation) that threshold
 * is `floor(J / 2) + 1` and a tie is impossible.
 *
 * @example
 * majorityThreshold(3); // 2
 * majorityThreshold(5); // 3
 */
export function majorityThreshold(judgeCount: number): number {
  if (judgeCount <= 0) return 0;
  return Math.floor(judgeCount / 2) + 1;
}

/** Whether `votesForPlayer` of `judgeCount` is already a resolving majority. */
export function isMajority(
  votesForPlayer: number,
  judgeCount: number,
): boolean {
  return judgeCount > 0 && votesForPlayer * 2 > judgeCount;
}
