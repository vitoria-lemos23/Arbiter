import { TrophyIcon } from "@phosphor-icons/react/dist/ssr";
import { ethLabel, shortAddress } from "../../lib/formatTournament";

/**
 * Champion slot for the bracket view (design screen 6): a `?` placeholder until
 * the final resolves, then the winner's address and the prize they took. Reads
 * the indexed `champion` (null until `TournamentCompleted`, spec 007).
 */
export function ChampionDisplay({
  champion,
  prizeWei,
}: {
  champion: string | null;
  prizeWei: string;
}) {
  if (!champion) {
    return (
      <div className="flex w-64 items-center gap-3 rounded-xl border border-dashed border-input bg-muted/30 px-4 py-6">
        <div className="grid size-8 shrink-0 place-items-center rounded-full border border-dashed border-input bg-muted/50 font-mono text-xs text-muted-foreground">
          ?
        </div>
        <span className="text-sm font-medium text-muted-foreground">TBD</span>
      </div>
    );
  }

  return (
    <div className="flex w-64 flex-col gap-2 rounded-xl border-l-4 border-l-primary border border-primary/40 bg-card px-4 py-5 shadow-sm">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary">
        <TrophyIcon weight="fill" className="size-4" />
        Champion
      </span>
      <span className="font-mono text-sm">{shortAddress(champion)}</span>
      <span className="font-mono text-lg font-bold text-primary">
        {ethLabel(prizeWei)}
      </span>
    </div>
  );
}
