"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSetDiscoverParams } from "../hooks/useSetDiscoverParams";
import { DISCOVER_SORTS, type DiscoverSort } from "../schema/discoverQuery";

const SORT_LABELS: Record<DiscoverSort, string> = {
  soon: "Starting soon",
  newest: "Newest",
  prize_desc: "Prize: high to low",
  prize_asc: "Prize: low to high",
};

const DEBOUNCE_MS = 300;

/**
 * Search + sort controls (client). The search box is debounced before it writes
 * `?q`; the sort dropdown writes `?sort` without resetting the list window
 * (reordering does not narrow the result set).
 */
export function DiscoverSearchBar() {
  const searchParams = useSearchParams();
  const setParams = useSetDiscoverParams();
  const urlQuery = searchParams.get("q") ?? "";
  const sort = (searchParams.get("sort") as DiscoverSort | null) ?? "soon";
  const [text, setText] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);

  // Re-sync the input when the URL changes elsewhere (e.g. "Clear all filters"),
  // adjusting state during render rather than in an effect (React 19 guidance).
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    setText(urlQuery);
  }

  useEffect(() => {
    if (text === urlQuery) return;
    const id = setTimeout(() => setParams({ q: text || null }), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [text, urlQuery, setParams]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-56 flex-1">
        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Search tournaments, games, organizers"
          aria-label="Search tournaments"
          className="h-9 pl-8"
        />
      </div>
      <Select
        value={sort}
        onValueChange={(value) =>
          setParams({ sort: value }, { resetShow: false })
        }
      >
        <SelectTrigger className="h-9" aria-label="Sort tournaments">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DISCOVER_SORTS.map((option) => (
            <SelectItem key={option} value={option}>
              {SORT_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
