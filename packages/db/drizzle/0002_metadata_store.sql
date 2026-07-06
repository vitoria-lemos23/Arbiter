CREATE TABLE "images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data" "bytea" NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tournament_metadata" ADD COLUMN "owner_address" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament_metadata" ADD COLUMN "metadata" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament_metadata" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament_metadata" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "tournament_metadata" DROP COLUMN "image_url";--> statement-breakpoint
ALTER TABLE "tournament_metadata" DROP COLUMN "description";