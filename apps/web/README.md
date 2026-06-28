The Arbiter web app (Next.js App Router). See the repository root `README.md`
for full monorepo setup; this file covers app-specific details.

## Getting Started

This is a pnpm + Turborepo monorepo — run scripts from the repo root:

```bash
pnpm dev                        # all workspaces in watch mode
pnpm --filter @arbiter/web dev  # or just this app
```

Open [http://localhost:3000](http://localhost:3000). Edit `src/app/page.tsx`; the page auto-updates.

Fonts are loaded via [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts): **Outfit** (sans, the active theme font) and **Geist Mono** (monospace).

## Source layout

`src/app` holds App Router files only (routing, layouts, `error`/`loading`/`not-found`). Application code is feature-based:

```
src/
  app/                 App Router (routing only)
  features/<feature>/  components/ hooks/ actions/ server/ schema/
  shared/              cross-cutting code (web3, theme, …)
  components/ui/        shadcn primitives
  lib/                 utilities (cn)
  env.ts               validated environment (zod)
```

Component files are PascalCase (`.tsx`); other modules are camelCase (`.ts`). Next.js framework files and `components/ui/*` keep their conventional lowercase names.

## UI Components — shadcn/ui

This app uses [shadcn/ui](https://ui.shadcn.com/docs) for shared UI primitives. shadcn/ui is **not a runtime component library** — the CLI copies component source into the repo (`src/components/ui`), so the code is owned and editable here rather than imported from `node_modules`. Prefer composing these primitives over hand-rolling common components (buttons, inputs, dialogs, etc.).

**Setup in this repo**

- Config: [`components.json`](./components.json) — style `radix-luma`, base color `olive`, RSC enabled, Tailwind v4 (no `tailwind.config`), icons via [`@phosphor-icons/react`](https://phosphoricons.com), primitives via [`radix-ui`](https://www.radix-ui.com).
- Theme tokens live in [`src/app/globals.css`](./src/app/globals.css) (CSS variables, light + `.dark`).
- Dark mode via [`next-themes`](https://github.com/pacocoursey/next-themes): `ThemeProvider` and `ModeToggle` under [`src/shared/theme/`](./src/shared/theme); toggling switches the `.dark` class.
- The `cn()` class-merge helper is at [`src/lib/utils.ts`](./src/lib/utils.ts) (`@/lib/utils`).
- Components are written to `src/components/ui` (alias `@/components/ui`).

**Add a component** (run from the repo root; `-c apps/web` targets this workspace):

```bash
pnpm dlx shadcn@latest add <component> -c apps/web
# e.g. pnpm dlx shadcn@latest add button input dialog -c apps/web
```

Docs: [ui.shadcn.com/docs](https://ui.shadcn.com/docs.md) · [installation](https://ui.shadcn.com/docs/installation.md) · [components](https://ui.shadcn.com/docs/components.md). Always read the markdown docs before using the library (see the repo `AGENTS.md`), and check the installed `shadcn` CLI version rather than assuming flags.

## Testing

Unit tests run with [Vitest](https://vitest.dev): `pnpm --filter @arbiter/web test` (or `pnpm test` from the root). Tests live next to source as `*.test.ts`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
