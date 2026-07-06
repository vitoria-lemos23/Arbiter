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
 * lowercase (Business Rule #1); callers pass already-lowercased values.
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

/** Create on first write, overwrite on subsequent writes for the same address. */
export async function upsertMetadata(
  row: NewTournamentMetadataRow,
): Promise<TournamentMetadataRow> {
  const values = {
    ...row,
    tournamentAddress: row.tournamentAddress.toLowerCase(),
  };
  const [saved] = await db
    .insert(tournamentMetadata)
    .values(values)
    .onConflictDoUpdate({
      target: tournamentMetadata.tournamentAddress,
      set: {
        ownerAddress: values.ownerAddress,
        metadata: values.metadata,
        // `defaultNow()` only fires on INSERT; bump explicitly on the update path.
        updatedAt: sql`now()`,
      },
    })
    .returning();
  return saved;
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
