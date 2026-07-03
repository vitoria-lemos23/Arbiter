import { onchainTable } from "ponder";

/**
 * The indexed `tournament` table — one row per `TournamentCreated` event.
 * Ponder owns and writes it (in the `ponder` Postgres schema); the app reads it
 * through the mirror in `@arbiter/db/ponderTournament.ts`. Keep the two in sync.
 */
export const tournament = onchainTable("tournament", (t) => ({
  address: t.hex("address").primaryKey(),
  organizer: t.hex("organizer").notNull(),
  index: t.bigint("index").notNull(),
  format: t.integer("format").notNull(),
  maxPlayers: t.integer("max_players").notNull(),
  entryFee: t.bigint("entry_fee").notNull(),
  prize: t.bigint("prize").notNull(),
  startDate: t.timestamp("start_date").notNull(),
  endDate: t.timestamp("end_date").notNull(),
  blockNumber: t.bigint("block_number").notNull(),
  txHash: t.hex("tx_hash").notNull(),
  createdAt: t.timestamp("created_at").notNull(),
}));
