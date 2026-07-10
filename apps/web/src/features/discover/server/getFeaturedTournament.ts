import "server-only";
import { db, tournament, tournamentMetadata } from "@arbiter/db";
import { desc } from "drizzle-orm";
import {
  reconcile,
  type TournamentListItem,
} from "@/features/tournaments/server/reconcileMetadata";
import { trustedMetadataJoin } from "./trustedMetadataJoin";

/**
 * The hero slot: the newest tournament overall (by `createdAt`, tie-broken by
 * on-chain `index`), with reconciled metadata. Deliberately ignores the active
 * filters so the promotional slot is stable; returns null only when no
 * tournaments have been indexed yet (spec 010, business rule 1).
 */
export async function getFeaturedTournament(): Promise<TournamentListItem | null> {
  const [row] = await db
    .select({ tournament, metadata: tournamentMetadata })
    .from(tournament)
    .leftJoin(tournamentMetadata, trustedMetadataJoin)
    .orderBy(desc(tournament.createdAt), desc(tournament.index))
    .limit(1);

  if (!row) return null;
  return {
    tournament: row.tournament,
    metadata: reconcile(row.tournament, row.metadata),
  };
}
