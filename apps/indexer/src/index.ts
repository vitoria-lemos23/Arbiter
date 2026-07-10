import { ponder } from "ponder:registry";
import { match, registration, tournament, vote } from "ponder:schema";
import { getAddress } from "viem";
import { toMatchRows } from "./toMatchRows";
import { toRegistrationRow } from "./toRegistrationRow";
import { toTournamentRow } from "./toTournamentRow";
import { toVoteRow } from "./toVoteRow";

ponder.on("TournamentFactory:TournamentCreated", async ({ event, context }) => {
  await context.db.insert(tournament).values(toTournamentRow(event));
});

ponder.on("Tournament:PlayerRegistered", async ({ event, context }) => {
  await context.db.insert(registration).values(toRegistrationRow(event));
});

ponder.on("Tournament:BracketGenerated", async ({ event, context }) => {
  await context.db.insert(match).values(toMatchRows(event));
});

ponder.on("Tournament:VoteCast", async ({ event, context }) => {
  await context.db.insert(vote).values(toVoteRow(event));
});

// A resolved match records its winner and, unless it is the final (index 0),
// advances that winner into the parent slot using the same heap arithmetic as
// the contract: odd child -> parent.playerA, even child -> parent.playerB.
ponder.on("Tournament:MatchResolved", async ({ event, context }) => {
  const tournamentAddress = event.log.address.toLowerCase() as `0x${string}`;
  const matchIndex = Number(event.args.matchIndex);
  const winner = event.args.winner.toLowerCase() as `0x${string}`;

  await context.db
    .update(match, { id: `${tournamentAddress}-${matchIndex}` })
    .set({ winner, status: 2 });

  if (matchIndex > 0) {
    const parentIndex = Math.floor((matchIndex - 1) / 2);
    const slot =
      matchIndex % 2 === 1 ? { playerA: winner } : { playerB: winner };
    await context.db
      .update(match, { id: `${tournamentAddress}-${parentIndex}` })
      .set(slot);
  }
});

ponder.on("Tournament:MatchActivated", async ({ event, context }) => {
  const tournamentAddress = event.log.address.toLowerCase() as `0x${string}`;
  const matchIndex = Number(event.args.matchIndex);
  await context.db
    .update(match, { id: `${tournamentAddress}-${matchIndex}` })
    .set({ status: 1 });
});

ponder.on("Tournament:TournamentCompleted", async ({ event, context }) => {
  // The `tournament` table's PK is stored as emitted by the factory event
  // (checksummed, see toTournamentRow); `getAddress` canonicalizes the clone's
  // log address to the same casing so the PK lookup matches.
  await context.db
    .update(tournament, { address: getAddress(event.log.address) })
    .set({
      champion: event.args.champion.toLowerCase() as `0x${string}`,
      completedAt: new Date(Number(event.block.timestamp) * 1000),
    });
});
