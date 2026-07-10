import type { ProfileDoc } from "@arbiter/db";
import { z } from "zod";

/**
 * Validates the `ProfileDoc` payload persisted as the `profiles.metadata` jsonb
 * blob (spec 009). Shared by the client (before signing) and the server action
 * (before writing) so both hash the exact same normalized object — see
 * `lib/profileMessage.ts`.
 */

/** Max display-name length; surfaced in the validation message on overflow. */
export const MAX_DISPLAY_NAME = 50;

/**
 * `avatarUrl` is intentionally stricter than `tournamentMetadata.imageUrl`: it
 * must be one of our own `/api/images/:id` upload paths (a v4 UUID). Absolute /
 * external URLs are rejected to avoid SSRF and tracking-pixel abuse
 * (business rule 4).
 */
const avatarUrl = z
  .string()
  .trim()
  .regex(
    /^\/api\/images\/[0-9a-f-]{36}$/,
    "Avatar must be an uploaded /api/images/:id path",
  );

export const profileDocSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(
      MAX_DISPLAY_NAME,
      `Display name is at most ${MAX_DISPLAY_NAME} characters`,
    ),
  avatarUrl: avatarUrl.optional(),
});

// Compile-time guarantee the Zod output matches the db doc type (single source
// of truth for the jsonb shape). Either direction failing is a type error.
type SchemaDoc = z.infer<typeof profileDocSchema>;
const _assertSchemaMatchesDb: ProfileDoc = {} as SchemaDoc;
const _assertDbMatchesSchema: SchemaDoc = {} as ProfileDoc;
void _assertSchemaMatchesDb;
void _assertDbMatchesSchema;

export type ProfileInput = SchemaDoc;
