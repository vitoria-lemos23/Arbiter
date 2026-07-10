"use server";

import {
  db,
  judge as judgeTable,
  registration,
  type TournamentMetadataRow,
  tournament,
  tournamentMetadata,
} from "@arbiter/db";
import { eq, sql } from "drizzle-orm";
import {
  reconcile,
  type TournamentListItem,
} from "../server/reconcileMetadata";

/**
 * "My Tournaments" (#008): every tournament the connected wallet touches, with
 * the role(s) it holds. Three indexed lookups — organizer (on the `tournament`
 * row), judge (`ponder.judge`), player (`ponder.registration`) — merged into one
 * deduplicated, role-annotated list. Only the given wallet is ever queried, so
 * the page never exposes another user's involvement.
 */

export type MyTournamentRole = "organizer" | "judge" | "player";

/** A discover-card item enriched with the caller's role set for this tournament. */
export type MyTournament = TournamentListItem & {
  roles: MyTournamentRole[];
};

/** One joined `{ tournament, metadata }` row, before role annotation. */
type JoinedRow = {
  tournament: TournamentListItem["tournament"];
  metadata: TournamentMetadataRow | null;
};

/**
 * Ponder stores clone addresses checksummed on the `tournament` row but
 * lowercased on `registration`/`judge` (see the indexer decoders), so joins go
 * through `lower()`; the caller's wallet is lowercased once up front.
 */
const metadataJoin = eq(
  sql`lower(${tournament.address})`,
  sql`lower(${tournamentMetadata.tournamentAddress})`,
);

/** Tournaments where the wallet is the on-chain organizer. */
function queryOrganizer(wallet: string) {
  return db
    .select({ tournament, metadata: tournamentMetadata })
    .from(tournament)
    .leftJoin(tournamentMetadata, metadataJoin)
    .where(eq(sql`lower(${tournament.organizer})`, wallet));
}

/** Tournaments where the wallet is on the judge panel (`ponder.judge`). */
function queryJudge(wallet: string) {
  return db
    .select({ tournament, metadata: tournamentMetadata })
    .from(judgeTable)
    .innerJoin(
      tournament,
      eq(sql`lower(${tournament.address})`, judgeTable.judge),
    )
    .leftJoin(tournamentMetadata, metadataJoin)
    .where(eq(judgeTable.judge, wallet));
}

/** Tournaments where the wallet is a registered player (`ponder.registration`). */
function queryPlayer(wallet: string) {
  return db
    .select({ tournament, metadata: tournamentMetadata })
    .from(registration)
    .innerJoin(
      tournament,
      eq(sql`lower(${tournament.address})`, registration.tournament),
    )
    .leftJoin(tournamentMetadata, metadataJoin)
    .where(eq(registration.player, wallet));
}

/** Fold one role's rows into the dedup map, appending the role on repeat hits. */
function mergeRole(
  byAddress: Map<string, MyTournament>,
  rows: JoinedRow[],
  role: MyTournamentRole,
): void {
  for (const row of rows) {
    const key = row.tournament.address.toLowerCase();
    const existing = byAddress.get(key);
    if (existing) {
      if (!existing.roles.includes(role)) existing.roles.push(role);
      continue;
    }
    byAddress.set(key, {
      tournament: row.tournament,
      metadata: reconcile(row.tournament, row.metadata),
      roles: [role],
    });
  }
}

export async function listMyTournaments(
  walletAddress: string,
): Promise<MyTournament[]> {
  const wallet = walletAddress.toLowerCase();
  const [organizerRows, judgeRows, playerRows] = await Promise.all([
    queryOrganizer(wallet),
    queryJudge(wallet),
    queryPlayer(wallet),
  ]);

  // Merge order (organizer, judge, player) fixes the badge order on each card.
  const byAddress = new Map<string, MyTournament>();
  mergeRole(byAddress, organizerRows as JoinedRow[], "organizer");
  mergeRole(byAddress, judgeRows as JoinedRow[], "judge");
  mergeRole(byAddress, playerRows as JoinedRow[], "player");

  return [...byAddress.values()].sort(
    (a, b) =>
      b.tournament.createdAt.getTime() - a.tournament.createdAt.getTime(),
  );
}
