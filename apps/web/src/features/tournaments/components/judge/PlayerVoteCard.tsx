"use client";

import { CheckCircleIcon } from "@phosphor-icons/react";
import type { Address } from "viem";
import { Button } from "@/components/ui/button";
import { shortAddress } from "../../lib/formatTournament";

/**
 * One player's card on the judge vote screen (design screen 7): avatar, name
 * fallback (shortened address), full address + seed, live vote tally, and the
 * pick / selected control. Purely presentational — the parent owns selection
 * and transaction state.
 */
export function PlayerVoteCard({
  player,
  seed,
  votesFor,
  isWinner,
  isMyVote,
  isSelected,
  canPick,
  onPick,
}: {
  player: Address;
  seed?: number;
  votesFor: number;
  isWinner: boolean;
  isMyVote: boolean;
  isSelected: boolean;
  canPick: boolean;
  onPick: () => void;
}) {
  const highlighted = isWinner || isMyVote || isSelected;

  return (
    <div
      className={`flex flex-1 flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm ${
        highlighted
          ? "border-l-4 border-l-primary border-primary/40"
          : "border-input"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full bg-muted font-mono text-xs uppercase text-muted-foreground"
        >
          {player.slice(2, 4)}
        </span>
        <div className="flex flex-col">
          <span className="font-medium">{shortAddress(player)}</span>
          <span className="font-mono text-xs text-muted-foreground">
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
