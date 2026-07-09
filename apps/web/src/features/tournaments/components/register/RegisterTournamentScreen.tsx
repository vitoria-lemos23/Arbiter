import { ImageIcon } from "@phosphor-icons/react/dist/ssr";
import type { Address } from "viem";
import {
  ethLabel,
  formatLabel,
  shortAddress,
} from "../../lib/formatTournament";
import { deriveTournamentStatus } from "../../lib/tournamentStatus";
import type { TournamentListItem } from "../../server/reconcileMetadata";
import { TournamentStatusBadge } from "../details/TournamentStatusBadge";
import { RegisterPanel } from "./RegisterPanel";

/**
 * Server layout for `/tournaments/[address]/register` (spec 005, design section
 * 5 minus the out-of-scope name/avatar fields): tournament summary on the left,
 * the interactive registration panel on the right. `registeredCount` is the
 * indexed slots-filled figure; the panel re-checks capacity on-chain.
 */
export function RegisterTournamentScreen({
  item,
  registeredCount,
}: {
  item: TournamentListItem;
  registeredCount: number;
}) {
  const { tournament, metadata } = item;
  const status = deriveTournamentStatus(
    tournament.startDate,
    tournament.endDate,
    new Date(),
  );
  const free = tournament.entryFee === "0";

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-8 p-6 sm:p-12 lg:grid-cols-[1fr_minmax(20rem,26rem)]">
      <section className="flex flex-col gap-6">
        <SummaryCover url={metadata?.imageUrl} />
        <div className="flex flex-col gap-2">
          <TournamentStatusBadge status={status} />
          <h1 className="text-2xl font-bold tracking-tight">
            {metadata?.name ?? shortAddress(tournament.address)}
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            Organized by {shortAddress(tournament.organizer)}
          </p>
        </div>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <SummaryFact label="Format" value={formatLabel(tournament.format)} />
          <SummaryFact
            label="Slots filled"
            value={`${registeredCount} / ${tournament.maxPlayers}`}
            mono
          />
          <SummaryFact label="Prize" value={ethLabel(tournament.prize)} mono />
          <SummaryFact
            label="Entry fee"
            value={free ? "Free" : ethLabel(tournament.entryFee)}
            mono={!free}
          />
        </dl>
      </section>

      <RegisterPanel
        tournamentAddress={tournament.address as Address}
        entryFeeWei={tournament.entryFee}
        maxPlayers={tournament.maxPlayers}
        startDate={tournament.startDate}
      />
    </main>
  );
}

function SummaryCover({ url }: { url?: string }) {
  if (!url) {
    return (
      <div className="grid h-40 w-full place-items-center rounded-xl bg-muted text-muted-foreground">
        <ImageIcon className="size-10" />
      </div>
    );
  }
  return (
    // Off-chain cover served from our own /api/images route; a plain <img> keeps
    // the route self-contained (no next/image loader config needed).
    // biome-ignore lint/performance/noImgElement: served by our /api/images route
    <img src={url} alt="" className="h-40 w-full rounded-xl object-cover" />
  );
}

function SummaryFact({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono" : undefined}>{value}</dd>
    </div>
  );
}
