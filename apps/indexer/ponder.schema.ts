import { index, onchainTable } from "ponder";

/**
 * The indexed `tournament` table — one row per `TournamentCreated` event.
 * Ponder owns and writes it (in the `ponder` Postgres schema); the app reads it
 * through the mirror in `@arbiter/db/ponderTournament.ts`. Keep the two in sync.
 */
export const tournament = onchainTable("tournament", (t) => ({
  address: t.hex("address").primaryKey(),
  organizer: t.hex("organizer").notNull(),
  index: t.bigint("index").notNull(),
  format: t.integer("format").notNull(),
  maxPlayers: t.integer("max_players").notNull(),
  entryFee: t.bigint("entry_fee").notNull(),
  prize: t.bigint("prize").notNull(),
  startDate: t.timestamp("start_date").notNull(),
  endDate: t.timestamp("end_date").notNull(),
  // Set on TournamentCompleted (#007); null until the final match resolves.
  champion: t.hex("champion"),
  completedAt: t.timestamp("completed_at"),
  blockNumber: t.bigint("block_number").notNull(),
  txHash: t.hex("tx_hash").notNull(),
  createdAt: t.timestamp("created_at").notNull(),
}));

/**
 * The indexed `registration` table — one row per `PlayerRegistered` event on a
 * factory-discovered Tournament clone. Mirrored read-only by
 * `@arbiter/db/ponderRegistration.ts`; keep the two in sync.
 */
export const registration = onchainTable(
  "registration",
  (t) => ({
    id: t.text("id").primaryKey(), // `${tournament}-${player}` (lowercased)
    tournament: t.hex("tournament").notNull(), // clone address (log source)
    player: t.hex("player").notNull(),
    position: t.integer("position").notNull(), // 0-based registration order (seed)
    entryFeePaid: t.bigint("entry_fee_paid").notNull(), // wei
    blockNumber: t.bigint("block_number").notNull(),
    txHash: t.hex("tx_hash").notNull(),
    registeredAt: t.timestamp("registered_at").notNull(), // block timestamp
  }),
  // Index on `tournament` so "all participants of a tournament" is an index
  // scan, not a full-table scan — the dominant query for the roster.
  (table) => ({
    tournamentIdx: index().on(table.tournament),
  }),
);

/**
 * The indexed `judge` table — one row per `JudgeAssigned` event, emitted once
 * per judge during a clone's `initialize` (#008). Backs the "all tournaments I
 * judge" query the same way `registration` backs the per-player list. Mirrored
 * read-only by `@arbiter/db/ponderJudge.ts`; keep the two in sync.
 */
export const judge = onchainTable(
  "judge",
  (t) => ({
    id: t.text("id").primaryKey(), // `${tournament}-${judge}` (lowercased)
    tournament: t.hex("tournament").notNull(), // clone address (log source)
    judge: t.hex("judge").notNull(),
    blockNumber: t.bigint("block_number").notNull(),
    txHash: t.hex("tx_hash").notNull(),
    assignedAt: t.timestamp("assigned_at").notNull(), // block timestamp
  }),
  (table) => ({
    // "all tournaments I judge" is an index scan on `judge`, not a full scan.
    judgeIdx: index().on(table.judge),
    tournamentIdx: index().on(table.tournament),
  }),
);

export const match = onchainTable(
  "match",
  (t) => ({
    id: t.text("id").primaryKey(), // `${tournament}-${matchIndex}` (lowercased)
    tournament: t.hex("tournament").notNull(),
    matchIndex: t.integer("match_index").notNull(), // heap index; 0 = final
    round: t.integer("round").notNull(), // 1 = first round played; log2(N) = final
    playerA: t.hex("player_a"), // null = TBD
    playerB: t.hex("player_b"), // null = TBD
    seedA: t.integer("seed_a"), // null = TBD
    seedB: t.integer("seed_b"), // null = TBD
    winner: t.hex("winner"), // set on MatchResolved (#007); null = unresolved
    // MatchStatus enum index: 0 = Pending, 1 = Active, 2 = Completed.
    status: t.integer("status").notNull(),
    blockNumber: t.bigint("block_number").notNull(),
    txHash: t.hex("tx_hash").notNull(),
    generatedAt: t.timestamp("generated_at").notNull(),
  }),
  (table) => ({
    tournamentIdx: index().on(table.tournament),
  }),
);

/**
 * The indexed `vote` table — one row per `VoteCast` event on a Tournament clone.
 * Votes are immutable (#007), so rows are insert-only. Mirrored read-only by
 * `@arbiter/db/ponderVote.ts`; keep the two in sync.
 */
export const vote = onchainTable(
  "vote",
  (t) => ({
    id: t.text("id").primaryKey(), // `${tournament}-${matchIndex}-${judge}`
    tournament: t.hex("tournament").notNull(),
    matchIndex: t.integer("match_index").notNull(),
    judge: t.hex("judge").notNull(),
    votedFor: t.hex("voted_for").notNull(),
    blockNumber: t.bigint("block_number").notNull(),
    txHash: t.hex("tx_hash").notNull(),
    votedAt: t.timestamp("voted_at").notNull(),
  }),
  (table) => ({
    matchIdx: index().on(table.tournament, table.matchIndex),
  }),
);
