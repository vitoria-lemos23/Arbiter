import "server-only";
import type { Tournament, TournamentMetadataDoc } from "@arbiter/db";

/**
 * The indexed `ponder.tournament` table is the source of truth for which
 * tournaments exist; `tournament_metadata` is a left-joined enrichment. Orphan
 * metadata (a row whose creation tx never mined) never appears, and metadata is
 * only trusted when its `ownerAddress` matches the on-chain `organizer` — the
 * on-chain organizer is ground truth, which neutralizes any pre-mining metadata
 * front-running. Shared by the list and single-row fetches.
 */

export type TournamentListItem = {
  tournament: Tournament;
  /** Trusted metadata, or null when absent/unreconciled (render on-chain only). */
  metadata: TournamentMetadataDoc | null;
};

/** Keep metadata only when its owner matches the on-chain tournament organizer. */
export function reconcile(
  chain: Tournament,
  meta: { ownerAddress: string; metadata: TournamentMetadataDoc } | null,
): TournamentMetadataDoc | null {
  if (!meta) return null;
  if (meta.ownerAddress.toLowerCase() !== chain.organizer.toLowerCase()) {
    return null;
  }
  return meta.metadata;
}
