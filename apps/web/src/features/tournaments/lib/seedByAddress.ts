import type { Match } from "@arbiter/db";

/**
 * Builds a lowercased `player -> seed` lookup from the indexed bracket. Only
 * round-1 leaves carry seeds (advanced players have none), so this maps exactly
 * the seeded field. Used to annotate player cards on the judge/match screens.
 *
 * @example
 * seedByAddress(matches)["0xabc…"]; // 3
 */
export function seedByAddress(matches: Match[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const m of matches) {
    if (m.playerA && m.seedA != null) map[m.playerA.toLowerCase()] = m.seedA;
    if (m.playerB && m.seedB != null) map[m.playerB.toLowerCase()] = m.seedB;
  }
  return map;
}
