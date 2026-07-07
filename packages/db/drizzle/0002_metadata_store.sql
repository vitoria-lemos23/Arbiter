CREATE TABLE "images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data" "bytea" NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- The 0001 shape (name/image_url/description, no owner_address) is incompatible
-- with the new owner-gated jsonb model and cannot be backfilled, so clear any
-- pre-existing rows before adding the NOT NULL columns. This is a no-op on a
-- fresh table and lets the migration succeed on already-seeded environments
-- (otherwise ADD COLUMN ... NOT NULL fails on rows that predate these columns).
-- tournament_metadata is a rebuildable cache repopulated from signed writes.
DELETE FROM "tournament_metadata";--> statement-breakpoint
ALTER TABLE "tournament_metadata" ADD COLUMN "owner_address" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament_metadata" ADD COLUMN "metadata" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament_metadata" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament_metadata" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "tournament_metadata" DROP COLUMN "image_url";--> statement-breakpoint
ALTER TABLE "tournament_metadata" DROP COLUMN "description";