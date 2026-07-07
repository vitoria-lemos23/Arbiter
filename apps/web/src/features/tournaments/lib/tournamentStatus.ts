/**
 * Derives a tournament's lifecycle status from its indexed on-chain dates.
 * Pure and time-injected (no `Date.now()` inside) so it is deterministic and
 * node-testable, and callable from both server and client.
 *
 * Wording follows the design's badge labels (spec 004): the enrollment-era
 * "Reg open" label is intentionally NOT emitted here — Join is inert until a
 * future enrollment spec.
 *
 * @example
 * deriveTournamentStatus(start, end, new Date()); // → "soon" | "live" | "finished"
 */
export type TournamentStatus = "soon" | "live" | "finished";

export const TOURNAMENT_STATUS_LABEL: Record<TournamentStatus, string> = {
  soon: "Soon",
  live: "LIVE",
  finished: "Finished",
};

export function deriveTournamentStatus(
  startDate: Date,
  endDate: Date,
  now: Date,
): TournamentStatus {
  if (now < startDate) return "soon";
  if (now > endDate) return "finished";
  return "live";
}
