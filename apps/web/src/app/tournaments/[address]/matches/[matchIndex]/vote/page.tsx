import { notFound } from "next/navigation";
import { type Address, isAddress } from "viem";
import { JudgeVoteScreen } from "@/features/tournaments/components/judge/JudgeVoteScreen";
import { getRoundLabel } from "@/features/tournaments/lib/bracketRounds";
import { shortAddress } from "@/features/tournaments/lib/formatTournament";
import { seedByAddress } from "@/features/tournaments/lib/seedByAddress";
import { listMatches } from "@/features/tournaments/server/getBracket";
import { getTournamentWithMetadata } from "@/features/tournaments/server/getTournament";

// Reads indexed data per request — not prerendered at build.
export const dynamic = "force-dynamic";

export default async function MatchVotePage({
  params,
}: {
  params: Promise<{ address: string; matchIndex: string }>;
}) {
  const { address, matchIndex: rawIndex } = await params;
  // Malformed address (not 0x + 40 hex) -> 404. Route addresses are lowercased,
  // so skip EIP-55 checksum validation.
  if (!isAddress(address, { strict: false })) notFound();

  const matchIndex = Number(rawIndex);
  if (!Number.isInteger(matchIndex) || matchIndex < 0) notFound();

  const item = await getTournamentWithMetadata(address);
  if (!item) notFound();

  const matches = await listMatches(address);
  const matchRow = matches.find((m) => m.matchIndex === matchIndex);
  // No bracket yet, or an out-of-range index -> 404.
  if (!matchRow) notFound();

  return (
    <JudgeVoteScreen
      tournamentAddress={address as Address}
      matchIndex={matchIndex}
      tournamentName={item.metadata?.name ?? shortAddress(address)}
      tournamentHref={`/tournaments/${address}`}
      roundLabel={getRoundLabel(item.tournament.maxPlayers, matchRow.round)}
      seedByAddress={seedByAddress(matches)}
    />
  );
}
