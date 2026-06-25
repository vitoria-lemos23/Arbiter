# Arbiter

Decentralized tournament platform. Users create, manage, and participate in
competitive events, with outcomes recorded on-chain for verifiable, transparent
results.

## Tech stack

- **Web:** Next.js, React, Tailwind CSS, TypeScript
- **Blockchain:** Solidity, Hardhat 3, viem
- **Database:** PostgreSQL with Drizzle ORM
- **Tooling:** pnpm workspaces, Turborepo, Docker

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

# 2. Start PostgreSQL and apply migrations
pnpm db:up
cp packages/db/.env.example packages/db/.env
pnpm db:migrate

# 3. Configure the web app
cp apps/web/.env.example apps/web/.env.local

# 4. Run everything in dev mode
pnpm dev
```

The web app runs at http://localhost:3000.

### Connecting the Counter contract (optional)

The home page reads and increments the on-chain `Counter` contract via viem. To
exercise it end-to-end against a local chain:

```bash
# In one terminal — start a local Hardhat node (chain id 31337, port 8545)
pnpm --filter @arbiter/contracts exec hardhat node

# In another — deploy the Counter contract to that node
pnpm --filter @arbiter/contracts exec hardhat ignition deploy \
  ignition/modules/Counter.ts --network localhost
```

Then set the deployed address and a funded dev key in `apps/web/.env.local`:

```
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
COUNTER_ADDRESS=0x...        # address printed by the deploy
COUNTER_PRIVATE_KEY=0x...    # a prefunded account from `hardhat node`
```

Until `COUNTER_ADDRESS` is set the page still loads — it just shows that the
contract is unreachable.

## Common scripts

Run from the repository root (Turborepo orchestrates each workspace):

| Command           | Description                                  |
| ----------------- | -------------------------------------------- |
| `pnpm dev`        | Run all apps/packages in watch mode          |
| `pnpm build`      | Build every workspace                        |
| `pnpm lint`       | Lint every workspace                         |
| `pnpm typecheck`  | Type-check every workspace                   |
| `pnpm test`       | Run all tests                                |
| `pnpm db:up`      | Start the PostgreSQL container               |
| `pnpm db:down`    | Stop the PostgreSQL container                |
| `pnpm db:migrate` | Apply database migrations                    |
| `pnpm clean`      | Remove build artifacts and `node_modules`    |
```
