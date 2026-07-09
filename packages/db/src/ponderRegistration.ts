import {
  integer,
  numeric,
  pgSchema,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * READ-ONLY Drizzle mapping of the `registration` table that the Ponder indexer
 * owns and writes (see `apps/indexer`). Same ownership contract as
 * `ponderTournament.ts`: Ponder creates, migrates, and indexes this table in its
 * OWN Postgres schema (`ponder`) — the app must never issue DDL or writes
 * against it, and the `tournament` index is declared indexer-side only.
 *
 * Column types mirror Ponder's `onchainTable` output: `t.bigint()` →
 * `numeric(78,0)` (full uint256), `t.hex()` → `text`, `t.integer()` →
 * `integer`, `t.timestamp()` → `timestamp` (no timezone). Keep this in sync with
 * `apps/indexer/ponder.schema.ts`.
 */
const ponder = pgSchema("ponder");

export const registration = ponder.table("registration", {
  id: text("id").primaryKey(),
  tournament: text("tournament").notNull(),
  player: text("player").notNull(),
  position: integer("position").notNull(),
  entryFeePaid: numeric("entry_fee_paid", {
    precision: 78,
    scale: 0,
  }).notNull(),
  blockNumber: numeric("block_number", { precision: 78, scale: 0 }).notNull(),
  txHash: text("tx_hash").notNull(),
  registeredAt: timestamp("registered_at").notNull(),
});

export type Registration = typeof registration.$inferSelect;
