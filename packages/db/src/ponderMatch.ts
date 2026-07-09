import {
  integer,
  numeric,
  pgSchema,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * READ-ONLY Drizzle mapping of the `match` table that the Ponder indexer
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

export const match = ponder.table("match", {
  id: text("id").primaryKey(),
  tournament: text("tournament").notNull(),
  matchIndex: integer("match_index").notNull(),
  round: integer("round").notNull(),
  playerA: text("player_a"),
  playerB: text("player_b"),
  seedA: integer("seed_a"),
  seedB: integer("seed_b"),
  winner: text("winner"),
  blockNumber: numeric("block_number", { precision: 78, scale: 0 }).notNull(),
  txHash: text("tx_hash").notNull(),
  generatedAt: timestamp("generated_at").notNull(),
});

export type Match = typeof match.$inferSelect;
