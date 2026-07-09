/**
 * Pure helper: maps maxPlayers + round number to a label (Final, Semifinals, Quarterfinals, else Round N)
 * and derives the tree shape.
 */

export function getRoundLabel(maxPlayers: number, round: number): string {
  const totalRounds = Math.log2(maxPlayers);
  if (round === totalRounds) return "Final";
  if (round === totalRounds - 1) return "Semifinals";
  if (round === totalRounds - 2) return "Quarterfinals";
  return `Round ${round}`;
}

/**
 * Returns an array of round numbers [1, 2, ..., log2(maxPlayers)]
 */
export function getRounds(maxPlayers: number): number[] {
  const totalRounds = Math.log2(maxPlayers);
  return Array.from({ length: totalRounds }, (_, i) => i + 1);
}
