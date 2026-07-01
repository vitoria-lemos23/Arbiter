import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Temporary sample table — used only to verify the db wiring end to end.
 * Replace with the real domain schema later.
 */
export const samples = pgTable("samples", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Sample = typeof samples.$inferSelect;
export type NewSample = typeof samples.$inferInsert;

/**
 * Off-chain tournament metadata, owned by the app (Drizzle migrates + writes).
 *
 * Keyed 1:1 by the tournament's predicted CREATE2 address, which is known
 * client-side before the creation tx is mined — so a row can be written ahead
 * of (or independently from) the on-chain `tournament` row the Ponder indexer
 * inserts. There is intentionally NO foreign key to that `tournament` table:
 * it lives in Ponder's own schema and may not exist yet when metadata lands.
 * Reconcile the two in the app layer by address.
 *
 * NOTE: writing this table is out of scope for spec 002 (metadata is only
 * `console.log`'d for now); the table + key exist so the deterministic-address
 * link is in place for a later metadata-write task.
 */
export const tournamentMetadata = pgTable("tournament_metadata", {
  // Predicted CREATE2 address of the tournament clone (lowercase 0x-hex).
  tournamentAddress: text("tournament_address").primaryKey(),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  description: text("description"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TournamentMetadata = typeof tournamentMetadata.$inferSelect;
export type NewTournamentMetadata = typeof tournamentMetadata.$inferInsert;
