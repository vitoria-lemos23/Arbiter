/**
 * Helpers for reading Next.js `searchParams`, whose values are `string`,
 * `string[]`, or `undefined`. Kept out of route files so pages stay
 * presentational.
 */

/**
 * Parse a numeric search param, taking the first value of an array and falling
 * back when absent or non-numeric.
 *
 * @example
 * const page = toInt(searchParams.page, 1);
 */
export function toInt(
  raw: string | string[] | undefined,
  fallback: number,
): number {
  const value = Number.parseInt(
    Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? ""),
    10,
  );
  return Number.isNaN(value) ? fallback : value;
}
