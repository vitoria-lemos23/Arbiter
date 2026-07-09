import "server-only";
import { db, type Registration, registration } from "@arbiter/db";
import { asc, count, eq } from "drizzle-orm";

/**
 * Roster reads against the Ponder-owned `ponder.registration` table. The
 * indexer inserts `tournament`/`player` already lowercased (see
 * `apps/indexer/src/toRegistrationRow.ts`), so a lowercased equality match
 * needs no `lower()` SQL and hits the indexer-owned `tournament` index.
 */

/** All registrations of one tournament, in registration (seed) order. */
export async function listRegistrations(
  tournamentAddress: string,
): Promise<Registration[]> {
  return db
    .select()
    .from(registration)
    .where(eq(registration.tournament, tournamentAddress.toLowerCase()))
    .orderBy(asc(registration.position));
}

/** Indexed slots-filled count for one tournament (eventually consistent). */
export async function countRegistrations(
  tournamentAddress: string,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(registration)
    .where(eq(registration.tournament, tournamentAddress.toLowerCase()));
  return row?.value ?? 0;
}
