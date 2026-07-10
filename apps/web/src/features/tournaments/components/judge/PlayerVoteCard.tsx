"use client";

import type { ProfileDoc } from "@arbiter/db";
import { CheckCircleIcon } from "@phosphor-icons/react";
import Link from "next/link";
import type { Address } from "viem";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/features/profiles/components/UserAvatar";
import { shortAddress } from "../../lib/formatTournament";

/**
 * One player's card on the judge vote screen (design screen 7): avatar, name
 * fallback (shortened address), full address + seed, live vote tally, and the
 * pick / selected control. Purely presentational — the parent owns selection
 * and transaction state. Avatar + name resolved from `profile` when available,
 * falling back to the generated avatar + `shortAddress` (spec 009).
 */
export function PlayerVoteCard({
  player,
  profile,
  seed,
  votesFor,
  isWinner,
  isMyVote,
  isSelected,
  canPick,
  onPick,
}: {
  player: Address;
  profile?: ProfileDoc;
  seed?: number;
  votesFor: number;
  isWinner: boolean;
  isMyVote: boolean;
  isSelected: boolean;
  canPick: boolean;
  onPick: () => void;
}) {
  const highlighted = isWinner || isMyVote || isSelected;
  const name = profile?.displayName;

  return (
    <div
      className={`flex flex-1 flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm ${
        highlighted
          ? "border-l-4 border-l-primary border-primary/40"
          : "border-input"
      }`}
    >
      <div className="flex items-center gap-3">
        <Link
          href={`/profile/${player.toLowerCase()}`}
          className="shrink-0 transition-opacity hover:opacity-80"
        >
          <UserAvatar
            address={player}
            avatarUrl={profile?.avatarUrl}
            displayName={name}
            size="md"
          />
        </Link>
        <div className="flex min-w-0 flex-col">
          <Link
            href={`/profile/${player.toLowerCase()}`}
            className="font-medium transition-colors hover:text-primary"
          >
            {name ?? shortAddress(player)}
          </Link>
          <span className="truncate font-mono text-xs text-muted-foreground">
            {player}
          </span>
        </div>
        {seed ? (
          <span className="ml-auto font-mono text-xs text-muted-foreground">
            #{seed}
          </span>
        ) : null}
      </div>

      {/* Submission / result evidence is a future feature (spec 007). */}
      <div className="grid h-24 place-items-center rounded-lg border border-dashed border-input bg-muted/30 text-xs text-muted-foreground">
        Submission preview coming soon
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {votesFor} {votesFor === 1 ? "vote" : "votes"}
        </span>
        <PickControl
          isWinner={isWinner}
          isMyVote={isMyVote}
          isSelected={isSelected}
          canPick={canPick}
          onPick={onPick}
        />
      </div>
    </div>
  );
}

function PickControl({
  isWinner,
  isMyVote,
  isSelected,
  canPick,
  onPick,
}: {
  isWinner: boolean;
  isMyVote: boolean;
  isSelected: boolean;
  canPick: boolean;
  onPick: () => void;
}) {
  if (isWinner) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
        <CheckCircleIcon weight="fill" className="size-4" />
        Winner
      </span>
    );
  }
  if (isMyVote) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
        <CheckCircleIcon weight="fill" className="size-4" />
        Selected as winner
      </span>
    );
  }
  if (!canPick) return null;
  return (
    <Button
      type="button"
      variant={isSelected ? "default" : "outline"}
      size="sm"
      onClick={onPick}
    >
      {isSelected ? "Selected as winner" : "Pick as winner"}
    </Button>
  );
}
