import "server-only";
import type { ProfileDoc } from "@arbiter/db";
import { getProfileRows } from "./profileStore";

/**
 * Batch lookup used by the propagation sites (participant lists, brackets,
 * judging) so N addresses resolve to their profile docs in a single query,
 * avoiding an N+1 (spec 009). Returns a map keyed by LOWERCASE address;
 * addresses without a profile are simply absent from the map, and the caller
 * renders the `shortAddress` + generated-avatar fallback.
 */
export async function getProfilesByAddresses(
  addresses: string[],
): Promise<Map<string, ProfileDoc>> {
  if (addresses.length === 0) return new Map();
  const rows = await getProfileRows(addresses);
  return new Map(
    rows.map((row) => [row.userAddress.toLowerCase(), row.metadata]),
  );
}
