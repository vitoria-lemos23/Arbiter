import { parseEther } from "viem";
import { z } from "zod";
import { TOURNAMENT_FORMATS } from "@/features/tournaments/schema/createTournament";
import { clamp } from "@/lib/utils";

/**
 * Typed contract for the `/discover` URL. Every filter/search/sort/paging knob
 * lives in `searchParams` so the Server Component can re-query and the resulting
 * links are shareable and work without client JS (spec 010).
 *
 * @example
 * const query = parseDiscoverQuery({ status: "live", sort: "prize_desc" });
 */

/** Cards always shown above the wide list. */
export const CARDS_COUNT = 3;
/** Wide-list rows added per page load / "Load more" click. */
export const LIST_STEP = 6;
/** Hard cap on rendered list rows (bounds the `?show` growth). */
export const MAX_SHOW = 60;

export const DISCOVER_SORTS = [
  "soon",
  "newest",
  "prize_desc",
  "prize_asc",
] as const;
export type DiscoverSort = (typeof DISCOVER_SORTS)[number];

/**
 * `open` = "Registration open" (derived status "soon"); see the decision log in
 * spec 010 for why "Upcoming" is not a separate value.
 */
export const DISCOVER_STATUSES = ["open", "live", "finished"] as const;
export type DiscoverStatus = (typeof DISCOVER_STATUSES)[number];

export type DiscoverQuery = {
  q: string;
  status: DiscoverStatus[];
  game: string | null;
  format: number[];
  /** Lower prize bound in wei (string), or null when unset. */
  minPrizeWei: string | null;
  /** Upper prize bound in wei (string), or null when unset. */
  maxPrizeWei: string | null;
  sort: DiscoverSort;
  show: number;
};

type RawParam = string | string[] | undefined;
type RawSearchParams = Record<string, RawParam>;

const sortSchema = z.enum(DISCOVER_SORTS).catch("soon");
const statusSchema = z.enum(DISCOVER_STATUSES);

/** First value of a repeatable param (Next hands arrays for repeats). */
function firstValue(raw: RawParam): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw;
}

/** Flatten a repeatable/CSV param into a trimmed, non-empty token list. */
function toList(raw: RawParam): string[] {
  const values = Array.isArray(raw) ? raw : raw == null ? [] : [raw];
  return values
    .flatMap((value) => value.split(","))
    .map((token) => token.trim())
    .filter(Boolean);
}

/** ETH decimal string -> wei string, or null when absent/unparseable. */
function toWei(raw: RawParam): string | null {
  const value = firstValue(raw)?.trim();
  if (!value) return null;
  try {
    return parseEther(value).toString();
  } catch {
    return null;
  }
}

function parseShow(raw: RawParam): number {
  const value = Number.parseInt(firstValue(raw) ?? "", 10);
  return clamp(Number.isNaN(value) ? LIST_STEP : value, LIST_STEP, MAX_SHOW);
}

/** Distinct, valid statuses in the canonical order. */
function parseStatuses(raw: RawParam): DiscoverStatus[] {
  const valid = toList(raw)
    .map((value) => statusSchema.safeParse(value))
    .flatMap((result) => (result.success ? [result.data] : []));
  return DISCOVER_STATUSES.filter((status) => valid.includes(status));
}

/** Valid, distinct on-chain format enum indexes. */
function parseFormats(raw: RawParam): number[] {
  const allowed = new Set<number>(TOURNAMENT_FORMATS.map((f) => f.value));
  const seen = new Set<number>();
  for (const token of toList(raw)) {
    const value = Number.parseInt(token, 10);
    if (allowed.has(value)) seen.add(value);
  }
  return [...seen];
}

/** Zod-parse raw `searchParams` into a typed, defaulted, clamped query. */
export function parseDiscoverQuery(sp: RawSearchParams): DiscoverQuery {
  return {
    q: firstValue(sp.q)?.trim() ?? "",
    status: parseStatuses(sp.status),
    game: firstValue(sp.game)?.trim() || null,
    format: parseFormats(sp.format),
    minPrizeWei: toWei(sp.minPrize),
    maxPrizeWei: toWei(sp.maxPrize),
    sort: sortSchema.parse(firstValue(sp.sort) ?? "soon"),
    show: parseShow(sp.show),
  };
}

/** Whether any narrowing filter/search is active (drives the empty state). */
export function hasActiveFilters(query: DiscoverQuery): boolean {
  return (
    query.q !== "" ||
    query.status.length > 0 ||
    query.game !== null ||
    query.format.length > 0 ||
    query.minPrizeWei !== null ||
    query.maxPrizeWei !== null
  );
}
