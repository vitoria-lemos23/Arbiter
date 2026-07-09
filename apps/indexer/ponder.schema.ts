import { index, onchainTable } from "ponder";

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

/**
 * The indexed `registration` table — one row per `PlayerRegistered` event on a
 * factory-discovered Tournament clone. Mirrored read-only by
 * `@arbiter/db/ponderRegistration.ts`; keep the two in sync.
 */
export const registration = onchainTable(
  "registration",
  (t) => ({
    id: t.text("id").primaryKey(), // `${tournament}-${player}` (lowercased)
    tournament: t.hex("tournament").notNull(), // clone address (log source)
    player: t.hex("player").notNull(),
    position: t.integer("position").notNull(), // 0-based registration order (seed)
    entryFeePaid: t.bigint("entry_fee_paid").notNull(), // wei
    blockNumber: t.bigint("block_number").notNull(),
    txHash: t.hex("tx_hash").notNull(),
    registeredAt: t.timestamp("registered_at").notNull(), // block timestamp
  }),
  // Index on `tournament` so "all participants of a tournament" is an index
  // scan, not a full-table scan — the dominant query for the roster.
  (table) => ({
    tournamentIdx: index().on(table.tournament),
  }),
);
