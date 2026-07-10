"use client";

import Link from "next/link";
import { useState } from "react";
import type { Address } from "viem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WalletConnect } from "@/shared/web3/components/WalletConnect";
import { useCastVote } from "../../hooks/useCastVote";
import { useMatchVotes } from "../../hooks/useMatchVotes";
import { MatchPanel } from "../bracket/MatchPanel";
import { PlayerVoteCard } from "./PlayerVoteCard";
import { VoteProgress } from "./VoteProgress";

/**
 * Full-page judge voting view (design screen 7). Reads the live match + vote
 * state on-chain (`useMatchVotes`) and casts an immutable vote (`useCastVote`);
 * the match auto-resolves on a majority. Doubles as the public match-detail
 * page \u2014 spectators see the same real-time breakdown, minus the vote controls.
 */
export function JudgeVoteScreen({
  tournamentAddress,
  matchIndex,
  tournamentName,
  tournamentHref,
  roundLabel,
  seedByAddress,
}: {
  tournamentAddress: Address;
  matchIndex: number;
  tournamentName: string;
  tournamentHref: string;
  roundLabel: string;
  seedByAddress: Record<string, number>;
}) {
  const { judges, match, votesByJudge, votesCast, isLoading, refetch } =
    useMatchVotes({ tournamentAddress, matchIndex });
  const {
    address,
    isConnected,
    wrongChain,
    busy,
    isPending,
    errorMessage,
    castVote,
    switchNetwork,
  } = useCastVote({ tournamentAddress, matchIndex, onSuccess: refetch });
  const [selected, setSelected] = useState<Address | null>(null);

  if (isLoading || !match) {
    return (
      <main className="mx-auto w-full max-w-5xl p-6 sm:p-12">
        <p className="text-sm text-muted-foreground">Loading match{"\u2026"}</p>
      </main>
    );
  }

  const me = address?.toLowerCase();
  const isJudge = Boolean(me && judges.some((j) => j.toLowerCase() === me));
  const myVote = me ? votesByJudge.get(me) : undefined;
  const resolved = match.status === 2;
  const hasVoted = Boolean(myVote);

  const votesFor = (player: Address) =>
    [...votesByJudge.values()].filter(
      (v) => v.toLowerCase() === player.toLowerCase(),
    ).length;

  // Judges may pick only when the match is live, they haven't voted, and their
  // wallet is on the right chain.
  const canPick =
    isJudge && !resolved && !hasVoted && isConnected && !wrongChain;

  const players: Address[] = [match.playerA, match.playerB];

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 p-6 sm:p-12 lg:grid-cols-[1fr_minmax(20rem,24rem)]">
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <nav className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <Link href={tournamentHref} className="hover:text-foreground">
              {tournamentName}
            </Link>
            <span aria-hidden>{"/"}</span>
            <span>{roundLabel}</span>
            <span aria-hidden>{"/"}</span>
            <span>Match {matchIndex}</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Who won this match?
            </h1>
            {isJudge ? <Badge variant="secondary">You are judge</Badge> : null}
          </div>
        </div>

        <VoteProgress votesCast={votesCast} judgeCount={judges.length} />

        <div className="flex flex-col gap-4 sm:flex-row">
          {players.map((player) => (
            <PlayerVoteCard
              key={player}
              player={player}
              seed={seedByAddress[player.toLowerCase()]}
              votesFor={votesFor(player)}
              isWinner={
                resolved && match.winner.toLowerCase() === player.toLowerCase()
              }
              isMyVote={Boolean(
                myVote && myVote.toLowerCase() === player.toLowerCase(),
              )}
              isSelected={selected?.toLowerCase() === player.toLowerCase()}
              canPick={canPick}
              onPick={() => setSelected(player)}
            />
          ))}
        </div>

        <VoteCallToAction
          resolved={resolved}
          hasVoted={hasVoted}
          isJudge={isJudge}
          isConnected={isConnected}
          wrongChain={wrongChain}
          busy={busy}
          isPending={isPending}
          canSubmit={canPick && selected !== null}
          errorMessage={errorMessage}
          onSubmit={() => selected && castVote(selected)}
          onSwitchNetwork={switchNetwork}
        />

        <p className="text-xs text-muted-foreground">
          Your vote is recorded on-chain. The match resolves automatically once
          a majority agrees.
        </p>
      </section>

      <MatchPanel
        match={match}
        roundLabel={roundLabel}
        judges={judges}
        votesByJudge={votesByJudge}
        seedByAddress={seedByAddress}
      />
    </main>
  );
}

function VoteCallToAction({
  resolved,
  hasVoted,
  isJudge,
  isConnected,
  wrongChain,
  busy,
  isPending,
  canSubmit,
  errorMessage,
  onSubmit,
  onSwitchNetwork,
}: {
  resolved: boolean;
  hasVoted: boolean;
  isJudge: boolean;
  isConnected: boolean;
  wrongChain: boolean;
  busy: boolean;
  isPending: boolean;
  canSubmit: boolean;
  errorMessage: string | null;
  onSubmit: () => void;
  onSwitchNetwork: () => void;
}) {
  if (resolved) {
    return (
      <p className="text-sm font-medium text-primary">Decided by majority.</p>
    );
  }
  if (!isConnected) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Connect a wallet to vote.
        </p>
        <WalletConnect />
      </div>
    );
  }
  if (!isJudge) {
    return (
      <p className="text-sm text-muted-foreground">
        You are viewing as a spectator. Only assigned judges can vote.
      </p>
    );
  }
  if (wrongChain) {
    return (
      <Button type="button" onClick={onSwitchNetwork}>
        Switch network
      </Button>
    );
  }
  if (hasVoted) {
    return (
      <Button type="button" disabled>
        Vote submitted
      </Button>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        disabled={!canSubmit || busy}
        onClick={onSubmit}
        className="sm:w-fit"
      >
        {isPending
          ? "Confirm in your wallet\u2026"
          : busy
            ? "Submitting\u2026"
            : "Submit vote & sign"}
      </Button>
      {errorMessage ? (
        <p className="text-xs text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  );
}
