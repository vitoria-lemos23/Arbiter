"use server";

import type { ProfileDoc } from "@arbiter/db";
import {
  getPlayedTournaments,
  type PlayedTournament,
} from "../server/getPlayedTournaments";
import { getProfile } from "../server/getProfile";

/**
 * Loads everything a profile view needs in one round-trip (spec 009): the
 * profile doc (or null) plus the address's played-tournaments history. Exposed
 * as a server action so the client-only `/profile` page — which reads the
 * connected wallet from wagmi — can fetch it, mirroring how the My Tournaments
 * dashboard calls `listMyTournaments`.
 */

export type ProfileView = {
  profile: ProfileDoc | null;
  played: PlayedTournament[];
};

export async function loadProfile(address: string): Promise<ProfileView> {
  const [row, played] = await Promise.all([
    getProfile(address),
    getPlayedTournaments(address),
  ]);
  return { profile: row?.metadata ?? null, played };
}
