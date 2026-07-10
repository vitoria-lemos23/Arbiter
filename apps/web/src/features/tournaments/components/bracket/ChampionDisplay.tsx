import type { ProfileDoc } from "@arbiter/db";
import { TrophyIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { UserAvatar } from "@/features/profiles/components/UserAvatar";
import { ethLabel, shortAddress } from "../../lib/formatTournament";

/**
 * Champion slot for the bracket view (design screen 6): a `?` placeholder until
 * the final resolves, then the winner\u2019s identity and the prize they took. Reads
 * the indexed `champion` (null until `TournamentCompleted`, spec 007). When a
 * profile is available the champion\u2019s display name + avatar are shown and linked
 * to `/profile/[address]` (spec 009); otherwise falls back to the generated
 * avatar + `shortAddress`.
 */
export function ChampionDisplay({
  champion,
  prizeWei,
  profile,
}: {
  champion: string | null;
  prizeWei: string;
  profile?: ProfileDoc;
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

  const name = profile?.displayName;

  return (
    <div className="flex w-64 flex-col gap-2 rounded-xl border-l-4 border-l-primary border border-primary/40 bg-card px-4 py-5 shadow-sm">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary">
        <TrophyIcon weight="fill" className="size-4" />
        Champion
      </span>
      <Link
        href={`/profile/${champion.toLowerCase()}`}
        className="inline-flex items-center gap-2 transition-colors hover:text-primary"
      >
        <UserAvatar
          address={champion}
          avatarUrl={profile?.avatarUrl}
          displayName={name}
          size="sm"
        />
        <span
          className={
            name ? "truncate text-sm font-medium" : "font-mono text-sm"
          }
        >
          {name ?? shortAddress(champion)}
        </span>
      </Link>
      <span className="font-mono text-lg font-bold text-primary">
        {ethLabel(prizeWei)}
      </span>
    </div>
  );
}
