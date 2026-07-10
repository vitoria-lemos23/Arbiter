import { index, numeric, pgSchema, text, timestamp } from "drizzle-orm/pg-core";

/**
 * READ-ONLY Drizzle mapping of the `judge` table that the Ponder indexer owns
 * and writes (see `apps/indexer`). Same ownership contract as
 * `ponderRegistration.ts`: Ponder creates, migrates, and indexes this table in
 * its OWN Postgres schema (`ponder`) — the app must never issue DDL or writes
 * against it. Backs the "all tournaments I judge" query for #008.
 *
 * Column types mirror Ponder's `onchainTable` output: `t.bigint()` →
 * `numeric(78,0)` (full uint256), `t.hex()` → `text`, `t.timestamp()` →
 * `timestamp` (no timezone). Keep this in sync with
 * `apps/indexer/ponder.schema.ts`.
 */
const ponder = pgSchema("ponder");

export const judge = ponder.table(
  "judge",
  {
    id: text("id").primaryKey(),
    tournament: text("tournament").notNull(),
    judge: text("judge").notNull(),
    blockNumber: numeric("block_number", { precision: 78, scale: 0 }).notNull(),
    txHash: text("tx_hash").notNull(),
    assignedAt: timestamp("assigned_at").notNull(),
  },
  (table) => [
    index("ponder_judge_judge_idx").on(table.judge),
    index("ponder_judge_tournament_idx").on(table.tournament),
  ],
);

export type Judge = typeof judge.$inferSelect;
