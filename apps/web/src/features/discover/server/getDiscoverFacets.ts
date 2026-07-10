import "server-only";
import { db, tournament, tournamentMetadata } from "@arbiter/db";
import { max, min, sql } from "drizzle-orm";
import { trustedMetadataJoin } from "./trustedMetadataJoin";

export type DiscoverFacets = {
  /** Distinct trusted `game` values, sorted, for the sidebar Select. */
  games: string[];
  /** Prize range bounds in wei (string), across all tournaments. */
  minPrizeWei: string;
  maxPrizeWei: string;
};

/**
 * Sidebar control sources, derived from the DB so options never drift from the
 * data: the distinct set of trusted game names and the min/max prize bounds
 * (spec 010). Untrusted metadata joins as NULL and is filtered out.
 */
export async function getDiscoverFacets(): Promise<DiscoverFacets> {
  const gameRows = await db
    .selectDistinct({
      game: sql<string | null>`${tournamentMetadata.metadata}->>'game'`,
    })
    .from(tournament)
    .leftJoin(tournamentMetadata, trustedMetadataJoin);

  const games = gameRows
    .map((row) => row.game)
    .filter((game): game is string => Boolean(game))
    .sort((a, b) => a.localeCompare(b));

  const [prize] = await db
    .select({ min: min(tournament.prize), max: max(tournament.prize) })
    .from(tournament);

  return {
    games,
    minPrizeWei: prize?.min ?? "0",
    maxPrizeWei: prize?.max ?? "0",
  };
}
