import {
  integer,
  numeric,
  pgSchema,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * READ-ONLY Drizzle mapping of the `vote` table that the Ponder indexer owns and
 * writes (see `apps/indexer`). Same ownership contract as `ponderTournament.ts`:
 * Ponder creates, migrates, and indexes this table in its OWN Postgres schema
 * (`ponder`) — the app must never issue DDL or writes against it, and the
 * (tournament, matchIndex) index is declared indexer-side only.
 *
 * Column types mirror Ponder's `onchainTable` output: `t.bigint()` →
 * `numeric(78,0)` (full uint256), `t.hex()` → `text`, `t.integer()` →
 * `integer`, `t.timestamp()` → `timestamp` (no timezone). Keep this in sync with
 * `apps/indexer/ponder.schema.ts`.
 */
const ponder = pgSchema("ponder");

export const vote = ponder.table("vote", {
  id: text("id").primaryKey(),
  tournament: text("tournament").notNull(),
  matchIndex: integer("match_index").notNull(),
  judge: text("judge").notNull(),
  votedFor: text("voted_for").notNull(),
  blockNumber: numeric("block_number", { precision: 78, scale: 0 }).notNull(),
  txHash: text("tx_hash").notNull(),
  votedAt: timestamp("voted_at").notNull(),
});

export type Vote = typeof vote.$inferSelect;
