import {
  customType,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

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
 * Postgres `bytea`. Drizzle has no first-class bytea helper, so map it as a Node
 * `Buffer` on both sides — postgres-js already serializes a Buffer to hex-bytea
 * and parses bytea back to a Buffer, so the identity mapping round-trips cleanly
 * (see `postgres/src/types.js` `bytea`).
 */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

/**
 * Binary image blobs (tournament covers/banners). Served via a Next.js Route
 * Handler; the app references them by the API URL `/api/images/:id`, never the
 * raw id — so image hosting can later move off-Postgres (S3/IPFS) without a
 * schema or metadata change.
 */
export const images = pgTable("images", {
  id: uuid("id").primaryKey().defaultRandom(),
  data: bytea("data").notNull(),
  mimeType: text("mime_type").notNull(), // allow-listed on upload
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ImageRow = typeof images.$inferSelect;
export type NewImageRow = typeof images.$inferInsert;

/**
 * Descriptive presentation payload stored as the `jsonb` document, kept flexible
 * so its shape can evolve without a migration. Validated by Zod in the web app
 * (`features/tournaments/schema/metadata.ts`); typed here for `$type`.
 *
 * `ownerAddress` is intentionally NOT part of this doc — it is an access-control
 * field that must be compared to the on-chain organizer, so it stays a typed,
 * queryable column on the row below.
 */
export type TournamentMetadataDoc = {
  name: string;
  description?: string;
  game?: string;
  category?: string;
  tags: string[];
  imageUrl?: string;
  /** Free-form tournament rules; plain text with preserved line breaks. */
  rules?: string;
};

/**
 * Off-chain tournament presentation data, owned by the app (Drizzle migrates +
 * writes). Keyed 1:1 by the tournament's predicted CREATE2 address (lowercase
 * 0x-hex), which is known client-side before the creation tx is mined — so a row
 * can be written ahead of the on-chain `tournament` row the Ponder indexer
 * inserts. There is intentionally NO foreign key to that `tournament` table: it
 * lives in Ponder's own schema and may not exist yet when metadata lands.
 * Reconcile the two in the app layer by address.
 *
 * `ownerAddress` is the wallet that signed the write; only it may update the
 * row. It is reconciled against the on-chain `organizer` at read time (the
 * on-chain organizer is ground truth).
 */
export const tournamentMetadata = pgTable("tournament_metadata", {
  tournamentAddress: text("tournament_address").primaryKey(),
  ownerAddress: text("owner_address").notNull(),
  metadata: jsonb("metadata").$type<TournamentMetadataDoc>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TournamentMetadataRow = typeof tournamentMetadata.$inferSelect;
export type NewTournamentMetadataRow = typeof tournamentMetadata.$inferInsert;
