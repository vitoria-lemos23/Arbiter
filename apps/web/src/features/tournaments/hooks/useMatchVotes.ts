"use client";

import { tournamentAbi } from "@arbiter/contracts";
import { type Address, zeroAddress } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { type config, tournamentChainId } from "@/shared/web3/config/wagmi";

type ConfiguredChainId = (typeof config.chains)[number]["id"];

/** Live on-chain state of one match (mirrors the Solidity `Match` struct). */
export type MatchState = {
  playerA: Address;
  playerB: Address;
  winner: Address;
  status: number; // 0 Pending, 1 Active, 2 Completed
  voteCount: number;
};

/**
 * Reads a match's public voting state directly from the tournament clone:
 * the judge panel, the live match struct, and every judge's cast vote. Reading
 * on-chain (rather than the indexer) keeps the breakdown real-time and lets the
 * UI reflect a vote the instant its tx mines — spec 007 business rule 4.
 *
 * All reads are pinned to the tournament chain so they resolve even while the
 * wallet is disconnected or on the wrong network.
 */
export function useMatchVotes(args: {
  tournamentAddress: Address;
  matchIndex: number;
}) {
  const base = {
    address: args.tournamentAddress,
    abi: tournamentAbi,
    chainId: tournamentChainId as ConfiguredChainId,
  } as const;

  const { data: judges, refetch: refetchJudges } = useReadContract({
    ...base,
    functionName: "getJudges",
  });
  const { data: matchPage, refetch: refetchMatch } = useReadContract({
    ...base,
    functionName: "getMatches",
    args: [BigInt(args.matchIndex), BigInt(1)],
  });
  const votesQuery = useReadContracts({
    contracts: (judges ?? []).map((judge) => ({
      ...base,
      functionName: "getVote" as const,
      args: [BigInt(args.matchIndex), judge] as const,
    })),
    query: { enabled: Boolean(judges && judges.length > 0) },
  });

  const match = matchPage?.[0] as MatchState | undefined;

  // judge (lowercased) -> player they voted for; absent when not yet voted.
  const votesByJudge = new Map<string, Address>();
  (judges ?? []).forEach((judge, i) => {
    const votedFor = votesQuery.data?.[i]?.result as Address | undefined;
    if (votedFor && votedFor !== zeroAddress) {
      votesByJudge.set(judge.toLowerCase(), votedFor);
    }
  });

  function refetch() {
    refetchJudges();
    refetchMatch();
    votesQuery.refetch();
  }

  return {
    judges: (judges ?? []) as readonly Address[],
    match,
    votesByJudge,
    votesCast: votesByJudge.size,
    isLoading: judges === undefined || match === undefined,
    refetch,
  };
}
