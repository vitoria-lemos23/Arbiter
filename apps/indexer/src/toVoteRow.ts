/**
 * Pure decode of a `VoteCast` event into a `vote` table row. Extracted from the
 * indexing handler so it can be unit-tested without a running Ponder/Postgres
 * (mirrors `toRegistrationRow`). The emitting clone's address (`log.address`)
 * identifies the tournament — the event itself omits it. The composite id
 * `${tournament}-${matchIndex}-${judge}` is unique because a judge can vote at
 * most once per match (#007, immutable votes).
 */

/** The subset of a Ponder `VoteCast` event this handler consumes. */
export interface VoteCastEvent {
  args: {
    matchIndex: bigint;
    judge: `0x${string}`;
    votedFor: `0x${string}`;
  };
  log: { address: `0x${string}` };
  block: { number: bigint; timestamp: bigint };
  transaction: { hash: `0x${string}` };
}

/** Unix seconds (as emitted on-chain) → JS Date for a `timestamp` column. */
function unixToDate(seconds: bigint): Date {
  return new Date(Number(seconds) * 1000);
}

export function toVoteRow(event: VoteCastEvent) {
  const tournament = event.log.address.toLowerCase() as `0x${string}`;
  const judge = event.args.judge.toLowerCase() as `0x${string}`;
  const votedFor = event.args.votedFor.toLowerCase() as `0x${string}`;
  const matchIndex = Number(event.args.matchIndex);
  return {
    id: `${tournament}-${matchIndex}-${judge}`,
    tournament,
    matchIndex,
    judge,
    votedFor,
    blockNumber: event.block.number,
    txHash: event.transaction.hash,
    votedAt: unixToDate(event.block.timestamp),
  };
}
