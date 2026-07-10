# 008 — My Tournaments

> A personalised dashboard at `/` that shows every tournament the connected wallet is involved in, grouped by role (organizer, judge, player).

## Meta

| Field           | Value                                                     |
|-----------------|-----------------------------------------------------------|
| **Status**      | Review                                                    |
| **Author**      | Ricardo Vinicius                                          |
| **Created**     | 2026-07-09                                                |
| **Updated**     | 2026-07-09                                                |
| **Depends on**  | —                                                         |
| **Supersedes**  | —                                                         |

---

## Problem Statement

The app has no way for a user to see the tournaments they are involved in at a glance. The home page (`/`) is currently a placeholder. Users who have organised, been appointed as judge, or registered as a player in multiple tournaments must navigate to individual tournament pages to find their events. This creates friction and makes the app feel incomplete as a personal dashboard.

---

## Goals & Non-Goals

### Goals

- [ ] Replace the placeholder home page (`/`) with the My Tournaments page.
- [ ] Show all tournaments where the connected wallet is an **organizer**, **judge**, or **player**.
- [ ] Display role badges on each tournament card so the user immediately understands their relationship to the event.
- [ ] Filter the list by role via tabs: **All**, **Organizer**, **Judge**, **Player**.
- [ ] Sort the list by creation date (newest first).
- [ ] Show an empty state when no tournaments match the selected tab.
- [ ] Show a connect-wallet prompt when the user's wallet is not connected.
- [ ] Index judge assignments on-chain so they can be queried efficiently (requires a smart-contract change and a new ponder table).

### Non-Goals

- Tournament editing or management actions from this page (owners see a link to the detail page, not a separate management UI).
- Status-based filtering (upcoming / live / finished) — all statuses are shown.
- Pagination — load all tournaments for the connected wallet.
- Push notifications or real-time updates when new tournaments appear.
- Mobile-specific layout changes beyond Tailwind responsive utilities.

---

## Proposed Solution

### Overview

```mermaid
flowchart TD
    A[User visits /] --> B{Wallet connected?}
    B -- No --> C[Empty state + Connect Wallet button]
    B -- Yes --> D[listMyTournaments(walletAddress)]
    D --> E[Merge: organizer | judge | player queries]
    E --> F[Annotate each result with role set]
    F --> G[Render MyTournamentsList with role tabs]
    G --> H{Tab selected}
    H -- All --> I[All tournaments]
    H -- Organizer --> J[Filter roles includes 'organizer']
    H -- Judge --> K[Filter roles includes 'judge']
    H -- Player --> L[Filter roles includes 'player']
```

The page is a client component because the wallet address is only available in the browser (wagmi). The component reads the address from `useAccount()`, calls a Server Action (`listMyTournaments`), and renders the result.

### User Experience

#### Happy path — wallet connected, tournaments exist

1. User visits `/`.
2. Page shows a heading "My Tournaments" and a `+` button to create a new tournament.
3. Role tabs are visible: **All** / **Organizer** / **Judge** / **Player**.
4. The **All** tab is selected by default.
5. Tournament cards are rendered in a responsive grid (3 columns on desktop, 2 on tablet, 1 on mobile).
6. Each card shows:
   - Tournament name (or address truncated if no metadata).
   - Game and category tags (if metadata present).
   - Start and end dates.
   - One or more role badges: `ORGANIZER` (default variant), `JUDGE` (secondary variant), `PLAYER` (outline variant).
   - Status indicator derived from dates: `Upcoming`, `Live`, `Finished`.
   - A "View" button linking to `/tournaments/[address]`.
7. Switching tabs filters cards to only those with the selected role.

#### Empty tab state

- If a tab has no matching tournaments, show an icon and the message:
  - **All**: "You haven’t joined any tournaments yet." + "Discover tournaments" link to `/discover`.
  - **Organizer**: "You haven’t created any tournaments yet." + "Create tournament" button linking to `/tournaments/new`.
  - **Judge**: "You haven’t been assigned as a judge yet."
  - **Player**: "You haven’t registered for any tournaments yet." + "Discover tournaments" link.

#### Wallet not connected

- A single-column centered empty state is shown.
- Heading: "Connect your wallet".
- Subtext: "Connect your wallet to see the tournaments you’re participating in."
- A shadcn `Button` labelled "Connect Wallet" that opens the existing wallet connection dialog.

#### Edge cases

| Scenario | Behaviour |
|----------|-----------|
| Tournament has on-chain data but no off-chain metadata | Display address (truncated checksummed) as title; omit game/category tags |
| Wallet is in multiple roles for one tournament | Card appears once in **All**; all applicable role badges are shown; card appears in each relevant role tab |
| Tournament has started but no bracket generated yet | Status badge shows "Live"; "View" link opens the detail page |
| Very long tournament name in metadata | Truncate with CSS `line-clamp-2` |

### Data Model

#### Smart contract change — new event

Add a `JudgeAssigned` event to `Tournament.sol`, emitted in `initialize()` for each judge:

```solidity
/// @notice Emitted once per judge during initialise. Indexed so the ponder
///         indexer can build a per-judge tournament list efficiently.
event JudgeAssigned(address indexed tournament, address indexed judge);
```

Emit inside `_storeJudges` (or inline in `initialize`) after each judge is pushed to storage:

```solidity
for (uint256 i = 0; i < judges.length; i++) {
    if (judges[i] == address(0)) revert ZeroJudgeAddress(i);
    _judges.push(judges[i]);
    emit JudgeAssigned(address(this), judges[i]);
}
```

#### Ponder schema — new `judge` table

Add to `apps/indexer/ponder.schema.ts`:

```ts
export const judge = onchainTable(
  "judge",
  (t) => ({
    id: t.text("id").primaryKey(),        // `${tournament}-${judge}` (lowercased)
    tournament: t.hex("tournament").notNull(),
    judge: t.hex("judge").notNull(),
    blockNumber: t.bigint("block_number").notNull(),
    txHash: t.hex("tx_hash").notNull(),
    assignedAt: t.timestamp("assigned_at").notNull(),
  }),
  (table) => ({
    judgeIdx: index().on(table.judge),     // "all tournaments I judge" query
    tournamentIdx: index().on(table.tournament),
  }),
);
```

#### DB mirror — `packages/db/src/ponderJudge.ts`

Read-only Drizzle mirror following the same pattern as `ponderRegistration.ts`:

```ts
// packages/db/src/ponderJudge.ts
import { bigint, index, pgSchema, text, timestamp } from "drizzle-orm/pg-core";

const ponderSchema = pgSchema("ponder");

export const ponderJudge = ponderSchema.table(
  "judge",
  {
    id: text("id").primaryKey(),
    tournament: text("tournament").notNull(),
    judge: text("judge").notNull(),
    blockNumber: bigint("block_number", { mode: "bigint" }).notNull(),
    txHash: text("tx_hash").notNull(),
    assignedAt: timestamp("assigned_at").notNull(),
  },
  (table) => [
    index("ponder_judge_judge_idx").on(table.judge),
    index("ponder_judge_tournament_idx").on(table.tournament),
  ],
);
```

Export it from `packages/db/src/index.ts` alongside the other ponder mirrors.

### Frontend Components

| Component | Path | Description |
|-----------|------|-------------|
| `page.tsx` | `apps/web/src/app/page.tsx` | Thin server-component entry; renders `MyTournamentsPage` |
| `MyTournamentsPage` | `features/tournaments/components/MyTournamentsPage.tsx` | Client component; reads wallet via `useAccount`, calls server action, renders list |
| `MyTournamentsList` | `features/tournaments/components/MyTournamentsList.tsx` | Tabs + grid; receives `MyTournament[]` as props |
| `MyTournamentsEmptyState` | `features/tournaments/components/MyTournamentsEmptyState.tsx` | Per-tab empty state message and CTA |
| `TournamentRoleBadge` | `features/tournaments/components/TournamentRoleBadge.tsx` | Renders one role badge with correct shadcn variant |
| `TournamentCard` | `features/tournaments/components/TournamentCard.tsx` | **Reuse existing** — extend props to accept optional `roles` array |

### Server Action

```ts
// apps/web/src/features/tournaments/actions/listMyTournaments.ts
"use server";

export type MyTournamentRole = "organizer" | "judge" | "player";

export type MyTournament = {
  address: string;
  metadata: TournamentMetadataDoc | null;
  roles: MyTournamentRole[];
  format: number;
  maxPlayers: number;
  entryFee: bigint;
  prize: bigint;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
};

export async function listMyTournaments(
  walletAddress: string,
): Promise<MyTournament[]>;
```

The implementation:
1. Queries `ponder.tournament WHERE organizer = walletAddress` — organizer set.
2. Queries `ponder.registration WHERE player = walletAddress` then fetches the associated tournament rows — player set.
3. Queries `ponder.judge WHERE judge = walletAddress` then fetches the associated tournament rows — judge set.
4. Merges into a `Map<address, MyTournament>` deduplicating by tournament address and accumulating roles.
5. Left-joins with `tournament_metadata` using `reconcileMetadata` to attach off-chain data.
6. Returns the merged list sorted by `createdAt` descending.

### Business Rules

1. A wallet may hold multiple roles in the same tournament; the tournament appears **once** in the All tab with all role badges visible.
2. The **All** tab count equals the number of unique tournaments, not the sum of role counts.
3. Role tabs are independent filters — each tab shows the subset where the wallet holds that specific role (irrespective of other roles).
4. Only the connected wallet address is ever queried; the page never exposes other users’ data.
5. Tournaments are always sorted by `createdAt` descending (newest first) regardless of status.
6. Metadata reconciliation follows the same rule as elsewhere in the app: if `ownerAddress` in `tournament_metadata` does not match the on-chain `organizer`, the metadata is discarded and the tournament is shown with raw on-chain fields only.
7. The page does not gate on wallet address format validation — the address comes from wagmi and is already checksummed.

---

## Implementation Plan

### 1. Smart Contract

1. `packages/contracts/contracts/Tournament.sol` — declare `JudgeAssigned` event and emit it in `_storeJudges`.
2. Regenerate ABIs: `pnpm --filter @arbiter/contracts build` (runs `scripts/generate-abi.mjs`).

### 2. Indexer

1. `apps/indexer/ponder.schema.ts` — add `judge` table definition with `judgeIdx` and `tournamentIdx` indexes.
2. `apps/indexer/src/Tournament.ts` (or equivalent handler file) — add handler for `JudgeAssigned` event that inserts into the `judge` table. Follow the existing `PlayerRegistered` handler pattern.

### 3. Database

1. `packages/db/src/ponderJudge.ts` — create the read-only Drizzle mirror table.
2. `packages/db/src/index.ts` — export `ponderJudge`.

### 4. Server Action

1. `apps/web/src/features/tournaments/actions/listMyTournaments.ts` — implement the three-query merge as described in the Server Action section.
2. Export the `MyTournament` and `MyTournamentRole` types from the actions file.

### 5. Frontend

1. `apps/web/src/features/tournaments/components/TournamentRoleBadge.tsx` — new component mapping role → shadcn `Badge` variant.
2. `apps/web/src/features/tournaments/components/TournamentCard.tsx` — extend to accept optional `roles?: MyTournamentRole[]`; render `TournamentRoleBadge` per role in the card header.
3. `apps/web/src/features/tournaments/components/MyTournamentsEmptyState.tsx` — renders the appropriate message and CTA for a given tab.
4. `apps/web/src/features/tournaments/components/MyTournamentsList.tsx` — renders shadcn `Tabs` (All / Organizer / Judge / Player) and the card grid; filters `MyTournament[]` by selected tab.
5. `apps/web/src/features/tournaments/components/MyTournamentsPage.tsx` — client component; calls `listMyTournaments(address)` via the server action (using `useEffect` or React `use`); renders `MyTournamentsList` or the connect-wallet empty state.
6. `apps/web/src/app/page.tsx` — replace placeholder content with `<MyTournamentsPage />`.

---

## Testing Strategy

### Backend Tests

| Test | Location | What to verify |
|------|----------|----------------|
| `listMyTournaments` — organizer role | `features/tournaments/actions/listMyTournaments.test.ts` | Returns correct tournaments when wallet is organizer |
| `listMyTournaments` — player role | same | Returns correct tournaments when wallet is registered player |
| `listMyTournaments` — judge role | same | Returns correct tournaments when wallet is in `ponder.judge` |
| Multi-role deduplication | same | A wallet with organizer + player roles on the same tournament produces one result with both roles in the array |
| Empty result | same | Returns `[]` when wallet has no involvement |
| Metadata reconciliation failure | same | Discards metadata when `ownerAddress` mismatches on-chain organizer; tournament still appears |
| Sort order | same | Results are ordered by `createdAt` descending |

Mock `@arbiter/db` calls with named fake classes (do not mock the DB at the connection level).

### Smart Contract Tests

1. `Tournament.t.sol` — assert `JudgeAssigned` is emitted once per judge during `initialize()`.
2. Assert no `JudgeAssigned` emission when `judges` array is empty.

### Manual Verification

1. Deploy a local Hardhat node and the factory contract.
2. Create a tournament with two judges and one registered player using three separate wallet addresses.
3. Confirm ponder indexes all three `JudgeAssigned` rows and the one `registration` row.
4. Visit `/` in the web app with each of the three wallets connected in turn.
5. Verify:
   - Organizer wallet: card appears in All and Organizer tabs; `ORGANIZER` badge visible.
   - Judge wallet: card appears in All and Judge tabs; `JUDGE` badge visible.
   - Player wallet: card appears in All and Player tabs; `PLAYER` badge visible.
6. Register the organizer wallet as a player too; confirm the card shows both `ORGANIZER` and `PLAYER` badges and appears in both role tabs.
7. Disconnect wallet; confirm connect-wallet empty state is shown.
8. Switch to a wallet with no involvement; confirm the All tab shows the generic empty state.

---

## Decision Log

| Date       | Decision | Rationale |
|------------|----------|-----------|
| 2026-07-09 | Emit `JudgeAssigned` per judge rather than including judges in `TournamentCreated` | Keeps log cost bounded (judges is an unbounded array); mirrors how `PlayerRegistered` events are already used for the player role |
| 2026-07-09 | Route at `/` replacing placeholder | Main nav already links `My Tournaments` to `/`; no marketing home page is planned |
| 2026-07-09 | No pagination | Each wallet is expected to have at most tens of tournaments; the overhead of implementing cursor pagination is not justified |
| 2026-07-09 | Sort by `createdAt` descending | Consistent with the rest of the app; shows recently created tournaments at the top regardless of their start date |
| 2026-07-09 | CTAs all link to `/tournaments/[address]` | No separate management page exists; avoids scope creep |
