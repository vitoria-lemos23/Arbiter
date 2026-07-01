CREATE TABLE "tournament_metadata" (
	"tournament_address" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image_url" text,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
