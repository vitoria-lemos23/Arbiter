/**
 * Pure decode of a `PlayerRegistered` event into a `registration` table row.
 * Extracted from the indexing handler so it can be unit-tested without a running
 * Ponder/Postgres (mirrors `toTournamentRow`). The emitting clone's address
 * (`log.address`) identifies the tournament — the event itself omits it.
 */

/** The subset of a Ponder `PlayerRegistered` event this handler consumes. */
export interface PlayerRegisteredEvent {
  args: {
    player: `0x${string}`;
    position: number;
    entryFeePaid: bigint;
  };
  log: { address: `0x${string}` };
  block: { number: bigint; timestamp: bigint };
  transaction: { hash: `0x${string}` };
}

/** Unix seconds (as emitted on-chain) → JS Date for a `timestamp` column. */
function unixToDate(seconds: bigint): Date {
  return new Date(Number(seconds) * 1000);
}

export function toRegistrationRow(event: PlayerRegisteredEvent) {
  const tournament = event.log.address.toLowerCase() as `0x${string}`;
  const player = event.args.player.toLowerCase() as `0x${string}`;
  return {
    id: `${tournament}-${player}`,
    tournament,
    player,
    position: event.args.position,
    entryFeePaid: event.args.entryFeePaid,
    blockNumber: event.block.number,
    txHash: event.transaction.hash,
    registeredAt: unixToDate(event.block.timestamp),
  };
}
