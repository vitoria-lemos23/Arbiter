import "server-only";
import { tournament, tournamentMetadata } from "@arbiter/db";
import { and, eq, sql } from "drizzle-orm";

/**
 * Left-join condition that keeps `tournament_metadata` only when it is trusted:
 * its `tournament_address` maps to the on-chain row AND its `owner_address`
 * equals the on-chain `organizer`. Because discover filters and searches on
 * metadata columns, this owner-match must live in the join itself — untrusted
 * metadata then joins as NULL, so it neither leaks into search nor renders,
 * preserving the guarantee in `reconcileMetadata.ts` (spec 010, business rule 3).
 */
export const trustedMetadataJoin = and(
  eq(
    sql`lower(${tournament.address})`,
    sql`lower(${tournamentMetadata.tournamentAddress})`,
  ),
  eq(
    sql`lower(${tournament.organizer})`,
    sql`lower(${tournamentMetadata.ownerAddress})`,
  ),
);
