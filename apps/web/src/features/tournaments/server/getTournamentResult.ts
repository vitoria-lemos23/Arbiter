import "server-only";
import { db, tournament } from "@arbiter/db";
import { eq, sql } from "drizzle-orm";

/** Completion outcome of a tournament (spec 007); nulls until the final resolves. */
export type TournamentResult = {
  champion: string | null;
  completedAt: Date | null;
};

/**
 * Reads the indexed champion + completion time for one tournament. The Ponder
 * `tournament` row stores the address as emitted (checksummed), so match
 * case-insensitively — mirrors `getTournamentWithMetadata`.
 */
export async function getTournamentResult(
  tournamentAddress: string,
): Promise<TournamentResult> {
  const [row] = await db
    .select({
      champion: tournament.champion,
      completedAt: tournament.completedAt,
    })
    .from(tournament)
    .where(
      eq(sql`lower(${tournament.address})`, tournamentAddress.toLowerCase()),
    )
    .limit(1);
  return {
    champion: row?.champion ?? null,
    completedAt: row?.completedAt ?? null,
  };
}
