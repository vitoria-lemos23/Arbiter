import "server-only";
import { db, tournament, tournamentMetadata } from "@arbiter/db";
import { eq, sql } from "drizzle-orm";
import { reconcile, type TournamentListItem } from "./reconcileMetadata";

/**
 * Single-row sibling of `listTournamentsWithMetadata`: fetches one indexed
 * tournament (Ponder `tournament` row left-joined to the app-owned
 * `tournament_metadata`, reconciled by owner). Existence is on-chain — a missing
 * `tournament` row returns `null` (the page maps that to a 404), regardless of
 * any orphan metadata.
 *
 * @example
 * const item = await getTournamentWithMetadata("0xabc…");
 * if (!item) notFound();
 */
export async function getTournamentWithMetadata(
  address: string,
): Promise<TournamentListItem | null> {
  const lowered = address.toLowerCase();
  const [row] = await db
    .select({ tournament, metadata: tournamentMetadata })
    .from(tournament)
    .leftJoin(
      tournamentMetadata,
      eq(
        sql`lower(${tournament.address})`,
        sql`lower(${tournamentMetadata.tournamentAddress})`,
      ),
    )
    .where(eq(sql`lower(${tournament.address})`, lowered))
    .limit(1);

  if (!row) return null;
  return {
    tournament: row.tournament,
    metadata: reconcile(row.tournament, row.metadata),
  };
}
