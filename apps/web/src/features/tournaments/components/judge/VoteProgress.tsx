import { majorityThreshold } from "../../lib/voteProgress";

/**
 * `X / Y voted, N needed for majority` with one pip per judge (filled for a
 * cast vote, empty for pending). Design screen 7 vote-progress row.
 */
export function VoteProgress({
  votesCast,
  judgeCount,
}: {
  votesCast: number;
  judgeCount: number;
}) {
  const needed = majorityThreshold(judgeCount);
  const pips = Array.from({ length: judgeCount }, (_, i) => i);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        {votesCast} / {judgeCount} voted, {needed} needed for majority
      </p>
      <div className="flex gap-1.5" aria-hidden>
        {pips.map((i) => (
          <span
            key={`pip-${i}`}
            className={`size-2.5 rounded-full ${
              i < votesCast ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
