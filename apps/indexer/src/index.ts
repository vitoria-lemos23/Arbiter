import { ponder } from "ponder:registry";
import { tournament } from "ponder:schema";
import { toTournamentRow } from "./toTournamentRow";

ponder.on("TournamentFactory:TournamentCreated", async ({ event, context }) => {
  await context.db.insert(tournament).values(toTournamentRow(event));
});
