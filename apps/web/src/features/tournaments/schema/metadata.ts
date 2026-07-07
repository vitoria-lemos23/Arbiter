import type { TournamentMetadataDoc } from "@arbiter/db";
import { z } from "zod";

/**
 * Validates the `TournamentMetadataDoc` presentation payload persisted as the
 * `tournament_metadata.metadata` jsonb blob. Shared by the client (before
 * signing) and the server action (before writing) so both hash the exact same
 * normalized object — see `lib/metadataMessage.ts`.
 */

/** `imageUrl` accepts a relative `/api/images/:id` ref or an absolute https URL. */
const imageUrl = z
  .string()
  .trim()
  .refine(
    (v) => /^\/api\/images\/[^/]+$/.test(v) || /^https:\/\/.+/.test(v),
    "Must be an /api/images/:id path or an https URL",
  );

export const tournamentMetadataSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  description: z.string().trim().max(2000).optional(),
  game: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  // Trim, drop blanks, de-duplicate (case-sensitive), cap at 20 items ≤ 40 chars.
  tags: z
    .array(
      z.string().trim().min(1).max(40, "Each tag is at most 40 characters"),
    )
    .max(20, "At most 20 tags")
    .transform((list) => [...new Set(list)])
    .default([]),
  imageUrl: imageUrl.optional(),
  // Plain text (not Markdown); rendered with preserved line breaks. See spec 004.
  rules: z.string().trim().max(5000).optional(),
});

// Compile-time guarantee the Zod output matches the db doc type (single source
// of truth for the jsonb shape). Either direction failing is a type error.
type SchemaDoc = z.infer<typeof tournamentMetadataSchema>;
const _assertSchemaMatchesDb: TournamentMetadataDoc = {} as SchemaDoc;
const _assertDbMatchesSchema: SchemaDoc = {} as TournamentMetadataDoc;
void _assertSchemaMatchesDb;
void _assertDbMatchesSchema;

export type TournamentMetadataInput = SchemaDoc;
