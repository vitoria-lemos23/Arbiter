import "server-only";
import { db, type Match, match } from "@arbiter/db";
import { asc, eq } from "drizzle-orm";

export async function listMatches(tournamentAddress: string): Promise<Match[]> {
  return db
    .select()
    .from(match)
    .where(eq(match.tournament, tournamentAddress.toLowerCase()))
    .orderBy(asc(match.matchIndex));
}
