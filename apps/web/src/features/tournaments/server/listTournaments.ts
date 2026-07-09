import "server-only";
import { db, tournament, tournamentMetadata } from "@arbiter/db";
import { count, desc, eq, sql } from "drizzle-orm";
import { reconcile, type TournamentListItem } from "./reconcileMetadata";

export type { TournamentListItem };

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
