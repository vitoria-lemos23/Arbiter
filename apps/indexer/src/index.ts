import { ponder } from "ponder:registry";
import { tournament } from "ponder:schema";
import { toTournamentRow } from "./toTournamentRow";

// Single subscription: the enriched `TournamentCreated` carries every column, so
// one insert fully populates the row — no second event or extra RPC read.
ponder.on("TournamentFactory:TournamentCreated", async ({ event, context }) => {
  await context.db.insert(tournament).values(toTournamentRow(event));
});
