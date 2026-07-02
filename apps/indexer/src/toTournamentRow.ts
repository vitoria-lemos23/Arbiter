/**
 * Pure decode of a `TournamentCreated` event into a `tournament` table row.
 * Extracted from the indexing handler so it can be unit-tested without a running
 * Ponder/Postgres: every field maps 1:1 from the enriched event + log context,
 * with unix-seconds (`uint64`) timestamps widened to JS `Date`.
 */

/** The subset of a Ponder `TournamentCreated` event this handler consumes. */
export interface TournamentCreatedEvent {
  args: {
    tournament: `0x${string}`;
    organizer: `0x${string}`;
    index: bigint;
    format: number;
    maxPlayers: number;
    entryFee: bigint;
    prize: bigint;
    startDate: bigint;
    endDate: bigint;
  };
  block: { number: bigint; timestamp: bigint };
  transaction: { hash: `0x${string}` };
}

/** Unix seconds (as emitted on-chain) → JS Date for a `timestamp` column. */
function unixToDate(seconds: bigint): Date {
  return new Date(Number(seconds) * 1000);
}

export function toTournamentRow(event: TournamentCreatedEvent) {
  return {
    address: event.args.tournament,
    organizer: event.args.organizer,
    index: event.args.index,
    format: event.args.format,
    maxPlayers: event.args.maxPlayers,
    entryFee: event.args.entryFee,
    prize: event.args.prize,
    startDate: unixToDate(event.args.startDate),
    endDate: unixToDate(event.args.endDate),
    blockNumber: event.block.number,
    txHash: event.transaction.hash,
    createdAt: unixToDate(event.block.timestamp),
  };
}
