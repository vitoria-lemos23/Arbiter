# Project Overview

Arbiter is a decentralized tournament platform that allows users to create, manage, and participate in competitive events. The platform leverages blockchain technology to ensure transparency, fairness, and security in tournament operations. Participants can compete in various games and sports, with the outcomes recorded on the blockchain for verifiable results.

# Tech Stack

- **Frontend:** React, Next.js, Tailwind CSS, Shadcn UI, wagmi/viem, and TypeScript
- **Blockchain:** Ethereum, Solidity, Hardhat, and Viem
- **Database:** PostgreSQL with Drizzle ORM
- **Tooling**: pnpm + TurboRepo (monorepo), Biome (format/lint), Vitest (tests), GitHub Actions (CI/CD), and Docker.

# Libraries Documentation URLs 

Always read the documentation of the libraries and frameworks used in the project to understand their functionalities, usage, and best practices. Use the markdown version of the documentation whenever possible for better readability and integration into the project documentation.

Use the following links to access the documentation for the libraries and frameworks used in the project:

- Viem: [https://viem.sh/docs/getting-started.md](https://viem.sh/docs/getting-started.md)
- Next.js: [https://nextjs.org/docs.md](https://nextjs.org/docs.md)
- Drizzle ORM: [https://orm.drizzle.team/docs/](https://orm.drizzle.team/docs/)
- Wagmi: [https://wagmi.sh/react/getting-started.md](https://wagmi.sh/react/getting-started.md)
- Shadcn UI: [https://ui.shadcn.com/docs.md](https://ui.shadcn.com/docs.md) — installation guide: [https://ui.shadcn.com/docs/installation.md](https://ui.shadcn.com/docs/installation.md)
- Hardhat: [https://hardhat.org/llms.txt](https://hardhat.org/llms.txt)
- Tailwind CSS: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- Biome: [https://biomejs.dev/guides/getting-started/](https://biomejs.dev/guides/getting-started/)
- Zod: [https://zod.dev/](https://zod.dev/)

# AI Guideline

## External Libraries and Frameworks
- Use only well-maintained and widely adopted libraries.
- Check always for the latest version of each library before including it in the project.
- When using external libraries, always check for documentation in the official repository or website.

## Package Management
- Check for the latest version of each package before including it in the project.

## Versions and Deprecations
- Do not rely on training-data knowledge of a library's API. Check the installed version (`node_modules/<pkg>/package.json`) and its type declarations/docs for `@deprecated` markers before using an API, and trust the type-checker/IDE hints over memory. This repo pins newer-than-default versions (Next 16, React 19, wagmi 3, Tailwind 4, Zod 4, Hardhat 3).

# Project Conventions

- **Monorepo:** pnpm workspaces + TurboRepo. Run scripts from the repo root; target a workspace with `pnpm --filter @arbiter/<name> <script>`.
- **Formatting/linting:** Biome owns formatting and linting (`pnpm check`, `pnpm format`); a husky pre-commit hook runs Biome on staged files. Do not add conflicting Prettier/ESLint *formatting* — the web app keeps `eslint-config-next` for Next-specific lint rules only. CSS, `public/`, drizzle, and generated files are excluded from Biome.
- **Web app structure:** `src/app` holds App Router files only. Feature code lives in `src/features/<feature>/{components,hooks,actions,server,schema}`; cross-cutting code in `src/shared/`; shadcn primitives in `src/components/ui`.
- **File naming:** component files are PascalCase `.tsx` (e.g. `IncrementCounterForm.tsx`); other modules are camelCase `.ts`. Leave Next.js framework files (`layout.tsx`, `page.tsx`, `error.tsx`, …) and shadcn `components/ui/*` in their conventional lowercase names.
- **Environment variables:** access through the validated `apps/web/src/env.ts` (zod), not raw `process.env`. `@arbiter/db` requires `DATABASE_URL`.
- **Contract ABIs:** generated from compiled artifacts into `packages/contracts/src/generated/` by `scripts/generate-abi.mjs` during `build` — never hand-edit them.
- **Verify real builds:** type-checking alone misses cross-package/bundler issues — run `pnpm build` (and exercise the app) before claiming a change works.
