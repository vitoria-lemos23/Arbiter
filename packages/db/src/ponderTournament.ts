import {
  integer,
  numeric,
  pgSchema,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * READ-ONLY Drizzle mapping of the `tournament` table that the Ponder indexer
 * owns and writes (see `apps/indexer`). Ponder creates and migrates this table
 * in its OWN Postgres schema (`ponder`); the app must never issue DDL or writes
 * against it. It is deliberately kept out of `schema.ts` — the only schema
 * `drizzle.config.ts` reads — so `drizzle-kit generate` never tries to manage it.
 *
 * Column types mirror Ponder's `onchainTable` output: `t.bigint()` →
 * `numeric(78,0)` (full uint256), `t.hex()` → `text`, `t.integer()` →
 * `integer`, `t.timestamp()` → `timestamp` (no timezone). Keep this in sync with
 * `apps/indexer/ponder.schema.ts`.
 */
const ponder = pgSchema("ponder");

export const tournament = ponder.table("tournament", {
  address: text("address").primaryKey(),
  organizer: text("organizer").notNull(),
  index: numeric("index", { precision: 78, scale: 0 }).notNull(),
  format: integer("format").notNull(),
  maxPlayers: integer("max_players").notNull(),
  entryFee: numeric("entry_fee", { precision: 78, scale: 0 }).notNull(),
  prize: numeric("prize", { precision: 78, scale: 0 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  blockNumber: numeric("block_number", { precision: 78, scale: 0 }).notNull(),
  txHash: text("tx_hash").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export type Tournament = typeof tournament.$inferSelect;
