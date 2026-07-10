"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { formatEther } from "viem";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ethLabel } from "@/features/tournaments/lib/formatTournament";
import { TOURNAMENT_FORMATS } from "@/features/tournaments/schema/createTournament";
import { useSetDiscoverParams } from "../hooks/useSetDiscoverParams";
import {
  DISCOVER_STATUSES,
  type DiscoverStatus,
} from "../schema/discoverQuery";
import type { DiscoverFacets } from "../server/getDiscoverFacets";

const STATUS_LABELS: Record<DiscoverStatus, string> = {
  open: "Registration open",
  live: "Live",
  finished: "Finished",
};

const ALL_GAMES = "__all__";

/** Flatten a repeatable/CSV param into a set for checkbox state. */
function readList(searchParams: URLSearchParams, key: string): string[] {
  return searchParams
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((token) => token.trim())
    .filter(Boolean);
}

function toggle(list: string[], value: string, checked: boolean): string[] {
  const next = list.filter((item) => item !== value);
  return checked ? [...next, value] : next;
}

/**
 * Filter sidebar (client): status, game, prize range, and format, plus "Clear
 * all filters". Every change writes the URL via {useSetDiscoverParams} so the
 * server re-queries; current state is read back from `searchParams` so a shared
 * link restores the controls (spec 010).
 */
export function DiscoverFilters({ facets }: { facets: DiscoverFacets }) {
  const searchParams = useSearchParams();
  const setParams = useSetDiscoverParams();

  const statuses = readList(searchParams, "status");
  const formats = readList(searchParams, "format");
  const game = searchParams.get("game") ?? ALL_GAMES;

  return (
    <aside className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide uppercase">
          Filters
        </h2>
        <Button asChild variant="ghost" size="sm">
          <Link href="/discover">Clear all</Link>
        </Button>
      </div>

      <FilterGroup label="Status">
        {DISCOVER_STATUSES.map((status) => (
          <CheckRow
            key={status}
            id={`status-${status}`}
            label={STATUS_LABELS[status]}
            checked={statuses.includes(status)}
            onCheckedChange={(checked) => {
              const next = toggle(statuses, status, checked);
              setParams({ status: next.length > 0 ? next : null });
            }}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Game">
        <Select
          value={game}
          onValueChange={(value) =>
            setParams({ game: value === ALL_GAMES ? null : value })
          }
        >
          <SelectTrigger className="w-full" aria-label="Filter by game">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_GAMES}>All games</SelectItem>
            {facets.games.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <PrizeFilter facets={facets} />

      <FilterGroup label="Format">
        {TOURNAMENT_FORMATS.map((format) => (
          <CheckRow
            key={format.value}
            id={`format-${format.value}`}
            label={format.label}
            checked={formats.includes(String(format.value))}
            onCheckedChange={(checked) => {
              const next = toggle(formats, String(format.value), checked);
              setParams({ format: next.length > 0 ? next : null });
            }}
          />
        ))}
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function CheckRow({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <Label htmlFor={id} className="text-sm font-normal">
        {label}
      </Label>
    </div>
  );
}

/**
 * Prize range slider. Bounds come from the DB facets (wei -> ETH); the selected
 * range writes `?minPrize`/`?maxPrize` on release, and is cleared when it spans
 * the full bounds so the URL stays clean.
 */
function PrizeFilter({ facets }: { facets: DiscoverFacets }) {
  const searchParams = useSearchParams();
  const setParams = useSetDiscoverParams();

  const floor = Number(formatEther(BigInt(facets.minPrizeWei)));
  const ceil = Number(formatEther(BigInt(facets.maxPrizeWei)));
  const hasRange = ceil > floor;
  const step = hasRange ? (ceil - floor) / 100 : 1;

  const desiredMin = searchParams.get("minPrize") ?? String(floor);
  const desiredMax = searchParams.get("maxPrize") ?? String(ceil);
  const [range, setRange] = useState<[number, number]>([
    Number(desiredMin),
    Number(desiredMax),
  ]);

  // Re-sync when the URL-derived range changes elsewhere (e.g. "Clear all"),
  // adjusting state during render rather than in an effect (React 19 guidance).
  const syncKey = `${desiredMin}:${desiredMax}`;
  const [syncedKey, setSyncedKey] = useState(syncKey);
  if (syncKey !== syncedKey) {
    setSyncedKey(syncKey);
    setRange([Number(desiredMin), Number(desiredMax)]);
  }

  if (!hasRange) return null;

  const commit = ([min, max]: number[]) => {
    setParams({
      minPrize: min > floor ? String(min) : null,
      maxPrize: max < ceil ? String(max) : null,
    });
  };

  return (
    <FilterGroup label="Prize">
      <Slider
        min={floor}
        max={ceil}
        step={step}
        value={range}
        onValueChange={(value) => setRange([value[0], value[1]])}
        onValueCommit={commit}
        aria-label="Prize range"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="font-mono">{ethLabel(weiFromEth(range[0]))}</span>
        <span className="font-mono">{ethLabel(weiFromEth(range[1]))}</span>
      </div>
    </FilterGroup>
  );
}

/** ETH number -> a wei string for {ethLabel} (rounds to whole wei). */
function weiFromEth(eth: number): string {
  return BigInt(Math.round(eth * 1e18)).toString();
}
