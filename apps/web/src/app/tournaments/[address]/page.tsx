import { notFound } from "next/navigation";
import { isAddress } from "viem";
import { TournamentDetails } from "@/features/tournaments/components/details/TournamentDetails";
import { getTournamentWithMetadata } from "@/features/tournaments/server/getTournament";

// Reads indexed data per request — not prerendered at build.
export const dynamic = "force-dynamic";

export default async function TournamentDetailsPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  // Malformed param (not 0x + 40 hex) -> 404. Route addresses are lowercased,
  // so skip EIP-55 checksum validation.
  if (!isAddress(address, { strict: false })) notFound();

  const item = await getTournamentWithMetadata(address);
  if (!item) notFound();

  return <TournamentDetails item={item} />;
}
