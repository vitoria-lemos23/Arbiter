import "server-only";
import {
  db,
  registration,
  type Tournament,
  type TournamentMetadataDoc,
  tournament,
  tournamentMetadata,
} from "@arbiter/db";
import { desc, eq, sql } from "drizzle-orm";
import { reconcile } from "@/features/tournaments/server/reconcileMetadata";

/**
 * Tournaments an address has PLAYED in (spec 009): rows where the address
 * appears in `ponder.registration`, joined to the indexed `ponder.tournament`
 * and left-joined to the reconciled app-owned metadata, newest-first by
 * registration time. Public history lists played tournaments only — organized
 * / judged history lives in the My Tournaments dashboard (spec 008).
 */

export type PlayedTournament = {
  tournament: Tournament;
  /** Trusted metadata, or null when absent/unreconciled (render on-chain only). */
  metadata: TournamentMetadataDoc | null;
  registeredAt: Date;
};

export async function getPlayedTournaments(
  address: string,
): Promise<PlayedTournament[]> {
  // The indexer stores `registration.player`/`tournament` lowercased but the
  // `tournament.address` checksummed, so the join goes through `lower()`.
  const rows = await db
    .select({
      tournament,
      metadata: tournamentMetadata,
      registeredAt: registration.registeredAt,
    })
    .from(registration)
    .innerJoin(
      tournament,
      eq(sql`lower(${tournament.address})`, registration.tournament),
    )
    .leftJoin(
      tournamentMetadata,
      eq(
        sql`lower(${tournament.address})`,
        sql`lower(${tournamentMetadata.tournamentAddress})`,
      ),
    )
    .where(eq(registration.player, address.toLowerCase()))
    .orderBy(desc(registration.registeredAt));

  return rows.map((row) => ({
    tournament: row.tournament,
    metadata: reconcile(row.tournament, row.metadata),
    registeredAt: row.registeredAt,
  }));
}
