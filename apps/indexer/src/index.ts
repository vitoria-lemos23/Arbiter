import { ponder } from "ponder:registry";
import { match, registration, tournament } from "ponder:schema";
import { toMatchRows } from "./toMatchRows";
import { toRegistrationRow } from "./toRegistrationRow";
import { toTournamentRow } from "./toTournamentRow";

ponder.on("TournamentFactory:TournamentCreated", async ({ event, context }) => {
  await context.db.insert(tournament).values(toTournamentRow(event));
});

ponder.on("Tournament:PlayerRegistered", async ({ event, context }) => {
  await context.db.insert(registration).values(toRegistrationRow(event));
});

ponder.on("Tournament:BracketGenerated", async ({ event, context }) => {
  await context.db.insert(match).values(toMatchRows(event));
});
