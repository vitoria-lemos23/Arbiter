import { ponder } from "ponder:registry";
import { registration, tournament } from "ponder:schema";
import { toRegistrationRow } from "./toRegistrationRow";
import { toTournamentRow } from "./toTournamentRow";

ponder.on("TournamentFactory:TournamentCreated", async ({ event, context }) => {
  await context.db.insert(tournament).values(toTournamentRow(event));
});

ponder.on("Tournament:PlayerRegistered", async ({ event, context }) => {
  await context.db.insert(registration).values(toRegistrationRow(event));
});
