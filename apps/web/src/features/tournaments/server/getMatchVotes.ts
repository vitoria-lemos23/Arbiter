import "server-only";
import { db, type Vote, vote } from "@arbiter/db";
import { and, asc, eq } from "drizzle-orm";

/**
 * Indexed votes for one match, in the order they were cast. Reads the
 * Ponder-owned `ponder.vote` table (insert-only — votes are immutable, #007).
 * The indexer stores `tournament`/`judge` already lowercased (see
 * `apps/indexer/src/toVoteRow.ts`), so a lowercased equality match hits the
 * (tournament, matchIndex) index without `lower()` SQL.
 *
 * Intended for server-rendered history/summaries; the live judge screen reads
 * the same data on-chain via `useMatchVotes` for real-time updates.
 */
export async function listMatchVotes(
  tournamentAddress: string,
  matchIndex: number,
): Promise<Vote[]> {
  return db
    .select()
    .from(vote)
    .where(
      and(
        eq(vote.tournament, tournamentAddress.toLowerCase()),
        eq(vote.matchIndex, matchIndex),
      ),
    )
    .orderBy(asc(vote.votedAt));
}
