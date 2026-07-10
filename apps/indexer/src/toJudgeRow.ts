/**
 * Pure decode of a `JudgeAssigned` event into a `judge` table row (#008).
 * Extracted from the indexing handler so it can be unit-tested without a running
 * Ponder/Postgres (mirrors `toRegistrationRow`). The event carries the emitting
 * clone's address in its `tournament` arg, so — unlike PlayerRegistered — the id
 * derives from the args, not `log.address`. The composite id
 * `${tournament}-${judge}` is unique because a judge is stored at most once per
 * tournament (see `_storeJudges`).
 */

/** The subset of a Ponder `JudgeAssigned` event this handler consumes. */
export interface JudgeAssignedEvent {
  args: {
    tournament: `0x${string}`;
    judge: `0x${string}`;
  };
  block: { number: bigint; timestamp: bigint };
  transaction: { hash: `0x${string}` };
}

/** Unix seconds (as emitted on-chain) → JS Date for a `timestamp` column. */
function unixToDate(seconds: bigint): Date {
  return new Date(Number(seconds) * 1000);
}

export function toJudgeRow(event: JudgeAssignedEvent) {
  const tournament = event.args.tournament.toLowerCase() as `0x${string}`;
  const judge = event.args.judge.toLowerCase() as `0x${string}`;
  return {
    id: `${tournament}-${judge}`,
    tournament,
    judge,
    blockNumber: event.block.number,
    txHash: event.transaction.hash,
    assignedAt: unixToDate(event.block.timestamp),
  };
}
