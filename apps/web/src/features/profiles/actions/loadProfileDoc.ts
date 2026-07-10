"use server";

import type { ProfileDoc } from "@arbiter/db";
import { getProfile } from "../server/getProfile";

/**
 * Fast server action to just fetch the connected wallet's profile (name/avatar)
 * for the global top bar WalletMenu.
 */
export async function loadProfileDoc(
  address: string,
): Promise<ProfileDoc | null> {
  const row = await getProfile(address);
  return row?.metadata ?? null;
}
