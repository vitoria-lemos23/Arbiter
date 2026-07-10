import "server-only";
import type { ProfileRow } from "@arbiter/db";
import { getProfileRow } from "./profileStore";

/**
 * Single profile for the public / own profile page (spec 009). Returns `null`
 * when the address has never saved a profile — every display site falls back to
 * `shortAddress` + a generated avatar in that case.
 */
export async function getProfile(address: string): Promise<ProfileRow | null> {
  const row = await getProfileRow(address);
  return row ?? null;
}
