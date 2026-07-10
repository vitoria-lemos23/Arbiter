/**
 * Pure URL helpers shared by the server route (the "Load more" link) and the
 * client controllers. Kept framework-agnostic (plain `URLSearchParams`) so it
 * runs on both sides without importing `next/navigation`.
 */

type RawSearchParams = Record<string, string | string[] | undefined>;

/** Rebuild a `URLSearchParams` from Next's awaited `searchParams` object. */
export function serializeParams(sp: RawSearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const entry of value) params.append(key, entry);
    } else {
      params.set(key, value);
    }
  }
  return params;
}

/** `/discover?...&show=N`, preserving every other active param. */
export function loadMoreHref(sp: RawSearchParams, nextShow: number): string {
  const params = serializeParams(sp);
  params.set("show", String(nextShow));
  return `/discover?${params.toString()}`;
}
