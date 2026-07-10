/**
 * Compact relative label for a tournament date ("in 3 days", "2 weeks ago"),
 * used in the featured hero summary line. Pure and time-injected (no
 * `Date.now()` inside) so it is deterministic and node-testable.
 *
 * @example
 * relativeDate(new Date("2026-07-13"), new Date("2026-07-10")); // "in 3 days"
 */
const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

export function relativeDate(target: Date, now: Date): string {
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  let duration = (target.getTime() - now.getTime()) / 1000;
  for (const { amount, unit } of DIVISIONS) {
    if (Math.abs(duration) < amount) {
      return formatter.format(Math.round(duration), unit);
    }
    duration /= amount;
  }
  return formatter.format(Math.round(duration), "year");
}
