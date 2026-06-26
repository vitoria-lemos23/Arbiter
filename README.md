# Arbiter

Decentralized tournament platform. Users create, manage, and participate in
competitive events, with outcomes recorded on-chain for verifiable, transparent
results.

## Tech stack

- **Web:** Next.js, React, Tailwind CSS, shadcn/ui, wagmi/viem, TypeScript
- **Blockchain:** Solidity, Hardhat 3, viem
- **Database:** PostgreSQL with Drizzle ORM
- **Tooling:** pnpm workspaces, Turborepo, Biome, Vitest, GitHub Actions, Docker

## Repository layout

```
apps/
  web/             Next.js application (UI + server actions)
packages/
  contracts/       Hardhat 3 + viem Solidity contracts (Counter sample)
  db/              Drizzle ORM schema, migrations, and client
```

## Prerequisites

- Node.js >= 20
- pnpm 11 (`corepack enable` to use the pinned version)
- Docker (for the local PostgreSQL database)

## Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL, apply migrations, and (optionally) seed sample data
pnpm db:up
cp packages/db/.env.example packages/db/.env
pnpm db:migrate
pnpm db:seed   # optional: insert a few sample rows

# 3. Configure the web app
cp apps/web/.env.example apps/web/.env.local

# 4. Run everything in dev mode
pnpm dev
```

The web app runs at http://localhost:3000.

### Connecting the Counter contract (optional)

The home page reads the on-chain `Counter` value on the server (viem) and lets
you increment it from a connected browser wallet (wagmi). To exercise it
end-to-end against a local chain:

```bash
# In one terminal — start a local Hardhat node (chain id 31337, port 8545)
pnpm --filter @arbiter/contracts exec hardhat node

# In another — deploy the Counter contract to that node
pnpm --filter @arbiter/contracts exec hardhat ignition deploy \
  ignition/modules/Counter.ts --network localhost
```

Then set the deployed address in `apps/web/.env.local` (these are exposed to
the browser, so they hold only public values — no private key):

```
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_COUNTER_ADDRESS=0x...   # address printed by the deploy
```

Finally, connect a browser wallet (e.g. MetaMask) to the local node — add a
network for `http://127.0.0.1:8545` / chain id `31337` and import one of the
prefunded accounts printed by `hardhat node` — then click **Connect** and
**Increment** on the home page.

Until `NEXT_PUBLIC_COUNTER_ADDRESS` is set the page still loads — it just shows
that the contract is unreachable.

## Common scripts

Run from the repository root (Turborepo orchestrates each workspace):

| Command           | Description                                  |
| ----------------- | -------------------------------------------- |
| `pnpm dev`        | Run all apps/packages in watch mode          |
| `pnpm build`      | Build every workspace                        |
| `pnpm lint`       | Lint every workspace                         |
| `pnpm typecheck`  | Type-check every workspace                   |
| `pnpm test`       | Run all tests                                |
| `pnpm format`     | Format the codebase with Biome               |
| `pnpm check`      | Biome format + lint check (no writes)        |
| `pnpm db:up`      | Start the PostgreSQL container               |
| `pnpm db:down`    | Stop the PostgreSQL container                |
| `pnpm db:migrate` | Apply database migrations                    |
| `pnpm db:seed`    | Seed the database with sample rows           |
| `pnpm clean`      | Remove build artifacts and `node_modules`    |
```
