import { notFound } from "next/navigation";
import { isAddress } from "viem";
import { PublicProfilePage } from "@/features/profiles/components/PublicProfilePage";
import { getPlayedTournaments } from "@/features/profiles/server/getPlayedTournaments";
import { getProfile } from "@/features/profiles/server/getProfile";

// Reads indexed data per request (played history) — not prerendered at build.
export const dynamic = "force-dynamic";

export default async function PublicProfileRoute({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  // Malformed param (not 0x + 40 hex) -> 404. Addresses are lowercased for
  // lookup, so skip EIP-55 checksum validation.
  if (!isAddress(address, { strict: false })) notFound();

  const [row, played] = await Promise.all([
    getProfile(address),
    getPlayedTournaments(address),
  ]);

  return (
    <PublicProfilePage
      address={address}
      profile={row?.metadata ?? null}
      played={played}
    />
  );
}
