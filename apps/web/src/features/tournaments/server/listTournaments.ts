import "server-only";
import {
  db,
  type Tournament,
  type TournamentMetadataDoc,
  tournament,
  tournamentMetadata,
} from "@arbiter/db";
import { count, desc, eq, sql } from "drizzle-orm";

/**
 * The indexed `ponder.tournament` table is the source of truth for which
 * tournaments exist; `tournament_metadata` is a left-joined enrichment. Orphan
 * metadata (a row whose creation tx never mined) simply never appears here
 * (Business Rule #7), and metadata is only trusted when its `ownerAddress`
 * matches the on-chain `organizer` (Business Rule #5) — the on-chain organizer
 * is ground truth, which neutralizes any pre-mining metadata front-running.
 */

export type TournamentListItem = {
  tournament: Tournament;
  /** Trusted metadata, or null when absent/unreconciled (render on-chain only). */
  metadata: TournamentMetadataDoc | null;
};

export async function listTournamentsWithMetadata(args: {
  page: number;
  pageSize: number;
}): Promise<TournamentListItem[]> {
  const rows = await db
    .select({ tournament, metadata: tournamentMetadata })
    .from(tournament)
    .leftJoin(
      tournamentMetadata,
      eq(
        sql`lower(${tournament.address})`,
        sql`lower(${tournamentMetadata.tournamentAddress})`,
      ),
    )
    .orderBy(desc(tournament.createdAt), desc(tournament.index))
    .limit(args.pageSize)
    .offset((args.page - 1) * args.pageSize);

  return rows.map((row) => ({
    tournament: row.tournament,
    metadata: reconcile(row.tournament, row.metadata),
  }));
}

export async function countTournaments(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(tournament);
  return row?.value ?? 0;
}

/** Rule #5: keep metadata only when the signer owns the on-chain tournament. */
function reconcile(
  chain: Tournament,
  meta: { ownerAddress: string; metadata: TournamentMetadataDoc } | null,
): TournamentMetadataDoc | null {
  if (!meta) return null;
  if (meta.ownerAddress.toLowerCase() !== chain.organizer.toLowerCase()) {
    return null;
  }
  return meta.metadata;
}
