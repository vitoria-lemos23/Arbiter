import { onchainTable } from "ponder";

/**
 * The indexed `tournament` table — one row per on-chain tournament, every column
 * decoded from the single enriched `TournamentCreated` event plus log context.
 *
 * Ponder OWNS and writes this table (in the `ponder` Postgres schema, set via
 * `--schema ponder`). The app reads it through the read-only Drizzle mapping in
 * `@arbiter/db` (`packages/db/src/ponderTournament.ts`) — keep the two in sync:
 * `t.hex()` → text, `t.bigint()` → numeric(78,0), `t.integer()` → integer,
 * `t.timestamp()` → timestamp (no tz). Explicit snake_case column names match
 * the Drizzle mapping's expectations.
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
