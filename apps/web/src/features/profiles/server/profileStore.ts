import "server-only";
import { db, type NewProfileRow, type ProfileRow, profiles } from "@arbiter/db";
import { eq, inArray, sql } from "drizzle-orm";

/**
 * Data-access for the app-owned `profiles` table (spec 009). Addresses are
 * keyed/compared lowercase; callers pass already-lowercased values. Mirrors
 * `tournaments/server/metadata.ts`.
 */

export async function getProfileRow(
  userAddress: string,
): Promise<ProfileRow | undefined> {
  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userAddress, userAddress.toLowerCase()))
    .limit(1);
  return row;
}

/** Batch fetch, used by the propagation sites to resolve N addresses at once. */
export async function getProfileRows(
  userAddresses: string[],
): Promise<ProfileRow[]> {
  if (userAddresses.length === 0) return [];
  const lowered = userAddresses.map((a) => a.toLowerCase());
  return db
    .select()
    .from(profiles)
    .where(inArray(profiles.userAddress, lowered));
}

/**
 * Create-or-update the caller's own profile. The primary key IS the owner, so
 * an upsert on `userAddress` is the whole write — the ownership check happens
 * in the `saveProfile` action before this is called.
 */
export async function upsertProfile(row: NewProfileRow): Promise<void> {
  const userAddress = row.userAddress.toLowerCase();
  await db
    .insert(profiles)
    .values({ ...row, userAddress })
    .onConflictDoUpdate({
      target: profiles.userAddress,
      set: { metadata: row.metadata, updatedAt: sql`now()` },
    });
}
