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
