import "server-only";
import {
  db,
  type NewTournamentMetadataRow,
  type TournamentMetadataRow,
  tournamentMetadata,
} from "@arbiter/db";
import { eq, sql } from "drizzle-orm";

/**
 * Data-access for the app-owned `tournament_metadata` table. Transport-agnostic
 * functions (per the samples convention) so they can be lifted into a shared
 * package if a separate backend is ever needed. Addresses are keyed/compared
 * lowercase; callers pass already-lowercased values.
 */

export async function getMetadata(
  tournamentAddress: string,
): Promise<TournamentMetadataRow | undefined> {
  const [row] = await db
    .select()
    .from(tournamentMetadata)
    .where(
      eq(tournamentMetadata.tournamentAddress, tournamentAddress.toLowerCase()),
    )
    .limit(1);
  return row;
}

/**
 * Insert metadata on first write; leave an existing row untouched. Creation is
 * one-shot (keyed to the freshly minted tournament address), so a conflict means
 * the row already exists and must not be clobbered — edits go through
 * `updateMetadata`, which is owner-gated.
 */
export async function createMetadata(
  row: NewTournamentMetadataRow,
): Promise<void> {
  await db
    .insert(tournamentMetadata)
    .values({ ...row, tournamentAddress: row.tournamentAddress.toLowerCase() })
    .onConflictDoNothing();
}

/** Overwrite an existing row's metadata (owner already verified by the caller). */
export async function updateMetadata(
  row: Pick<NewTournamentMetadataRow, "tournamentAddress" | "metadata">,
): Promise<TournamentMetadataRow | undefined> {
  const [saved] = await db
    .update(tournamentMetadata)
    .set({ metadata: row.metadata, updatedAt: sql`now()` })
    .where(
      eq(
        tournamentMetadata.tournamentAddress,
        row.tournamentAddress.toLowerCase(),
      ),
    )
    .returning();
  return saved;
}
