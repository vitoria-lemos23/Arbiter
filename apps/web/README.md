This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## UI Components — shadcn/ui

This app uses [shadcn/ui](https://ui.shadcn.com/docs) for shared UI primitives. shadcn/ui is **not a runtime component library** — the CLI copies component source into the repo (`src/components/ui`), so the code is owned and editable here rather than imported from `node_modules`. Prefer composing these primitives over hand-rolling common components (buttons, inputs, dialogs, etc.).

**Setup in this repo**

- Config: [`components.json`](./components.json) — style `radix-nova`, base color `neutral`, RSC enabled, Tailwind v4 (no `tailwind.config`), icons via [`lucide-react`](https://lucide.dev), primitives via [`radix-ui`](https://www.radix-ui.com).
- Theme tokens live in [`src/app/globals.css`](./src/app/globals.css) (CSS variables, light + `.dark`).
- The `cn()` class-merge helper is at [`src/lib/utils.ts`](./src/lib/utils.ts) (`@/lib/utils`).
- Components are written to `src/components/ui` (alias `@/components/ui`).

**Add a component** (run from the repo root; `-c apps/web` targets this workspace):

```bash
pnpm dlx shadcn@latest add <component> -c apps/web
# e.g. pnpm dlx shadcn@latest add button input dialog -c apps/web
```

Docs: [ui.shadcn.com/docs](https://ui.shadcn.com/docs.md) · [installation](https://ui.shadcn.com/docs/installation.md) · [components](https://ui.shadcn.com/docs/components.md). Always read the markdown docs before using the library (see the repo `AGENTS.md`), and check the installed `shadcn` CLI version rather than assuming flags.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
