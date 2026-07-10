import "server-only";
import { db, tournament, tournamentMetadata } from "@arbiter/db";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import {
  reconcile,
  type TournamentListItem,
} from "@/features/tournaments/server/reconcileMetadata";
import {
  CARDS_COUNT,
  type DiscoverQuery,
  type DiscoverStatus,
} from "../schema/discoverQuery";
import { trustedMetadataJoin } from "./trustedMetadataJoin";

export type DiscoverResult = {
  items: TournamentListItem[];
  /** Total matches (excluding the featured row); distinguishes the empty states. */
  total: number;
  /** Whether more list rows exist beyond `CARDS_COUNT + show`. */
  hasMore: boolean;
};

/** `metadata->>'key'` for a trusted (owner-matched) metadata document. */
function metaField(key: "name" | "game" | "category"): SQL {
  return sql`${tournamentMetadata.metadata}->>${sql.raw(`'${key}'`)}`;
}

/**
 * Date-derived status predicate, mirroring `deriveTournamentStatus`: `open` =
 * before start, `live` = within [start, end], `finished` = after end. Evaluated
 * against the DB clock so results match the SSR render.
 */
function statusCondition(status: DiscoverStatus): SQL {
  if (status === "open") return sql`now() < ${tournament.startDate}`;
  if (status === "finished") return sql`now() > ${tournament.endDate}`;
  return sql`${tournament.startDate} <= now() and now() <= ${tournament.endDate}`;
}

/** Order clause per sort option; stable tie-break on `index desc`. */
function orderByFor(sort: DiscoverQuery["sort"]): SQL[] {
  const tieBreak = desc(tournament.index);
  if (sort === "newest") return [desc(tournament.createdAt), tieBreak];
  if (sort === "prize_desc") return [desc(tournament.prize), tieBreak];
  if (sort === "prize_asc") return [asc(tournament.prize), tieBreak];
  return [asc(tournament.startDate), tieBreak];
}

/** Prize bounds in wei with an inverted (min > max) range swapped, per rule 4. */
function prizeBounds(query: DiscoverQuery): {
  min: string | null;
  max: string | null;
} {
  const { minPrizeWei: min, maxPrizeWei: max } = query;
  if (min !== null && max !== null && BigInt(min) > BigInt(max)) {
    return { min: max, max: min };
  }
  return { min, max };
}

function buildWhere(
  query: DiscoverQuery,
  featuredAddress: string | null,
): SQL | undefined {
  const conditions: SQL[] = [];

  if (featuredAddress) {
    conditions.push(
      sql`lower(${tournament.address}) <> ${featuredAddress.toLowerCase()}`,
    );
  }
  if (query.status.length > 0) {
    conditions.push(or(...query.status.map(statusCondition)) as SQL);
  }
  if (query.format.length > 0) {
    conditions.push(inArray(tournament.format, query.format));
  }

  const { min, max } = prizeBounds(query);
  if (min !== null) conditions.push(gte(tournament.prize, min));
  if (max !== null) conditions.push(lte(tournament.prize, max));

  if (query.game) {
    conditions.push(
      or(
        eq(metaField("game"), query.game),
        eq(metaField("category"), query.game),
      ) as SQL,
    );
  }
  if (query.q) {
    const pattern = `%${query.q}%`;
    conditions.push(
      or(
        ilike(tournament.organizer, pattern),
        ilike(metaField("name"), pattern),
        ilike(metaField("game"), pattern),
      ) as SQL,
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Build the discover result set from a parsed query. Fetches one extra row past
 * the visible window so the UI knows whether "Load more" is available, and a
 * separate `count()` so the page can tell "no tournaments" from "no matches".
 * The featured address is excluded so the hero never appears twice.
 */
export async function queryDiscoverTournaments(
  query: DiscoverQuery,
  opts: { featuredAddress?: string | null } = {},
): Promise<DiscoverResult> {
  const where = buildWhere(query, opts.featuredAddress ?? null);
  const visible = CARDS_COUNT + query.show;

  const rows = await db
    .select({ tournament, metadata: tournamentMetadata })
    .from(tournament)
    .leftJoin(tournamentMetadata, trustedMetadataJoin)
    .where(where)
    .orderBy(...orderByFor(query.sort))
    .limit(visible + 1);

  const [countRow] = await db
    .select({ value: count() })
    .from(tournament)
    .leftJoin(tournamentMetadata, trustedMetadataJoin)
    .where(where);

  const hasMore = rows.length > visible;
  const items = rows.slice(0, visible).map((row) => ({
    tournament: row.tournament,
    metadata: reconcile(row.tournament, row.metadata),
  }));

  return { items, total: countRow?.value ?? 0, hasMore };
}
