# AGENTS.md

Workflow rules for AI agents working in this repo.

## Tooling

- **Package manager**: pnpm (never npm). Build: `pnpm build` (= `tsc --noEmit && vite build`). Dev: `pnpm dev`.
- **Testing**: no framework installed yet. If adding, use vitest and only test pure functions (`src/rng.ts`, `src/face.ts`, `src/geom.ts`) — never canvas rendering.
- **Formatting/lint**: none configured. Match existing style (Biome-style, no semicolons avoided — follow the file's own conventions).

## Git workflow

- **Branches**: work on `dev`, open a PR to `main`. Squash merge.
- **Commits**: conventional commits (`feat:`, `fix:`, `ui:`, `chore:`, `docs:`).
- **DO NOT commit or push unless the user explicitly says so.** Show local preview (`pnpm preview`) and wait for confirmation.
- Deploy is handled by Vercel Git integration: push to `main` → production, push to `dev`/PR → preview. Never run `vercel --prod` manually.

## Critical invariants

### `api/_lib/dna.ts` is a copy of the face DNA logic

Vercel cannot bundle `../src/*` into serverless functions (that's why the OG endpoint has its own copy). **When you change `src/face.ts` (traits, weights, `mixFace`) or the palette constants in `src/ink.ts`, you MUST mirror the change in `api/_lib/dna.ts`.** Otherwise the web page and the OG share card (`/api/og?u=...`) render different faces for the same name.

### Determinism is the product

"Same name, same face" is the core promise. Never change `mulberry32`, `hashStr`, trait weights, or face building in a way that changes output for an existing seed without explicit approval. Tests should lock determinism if added.

## Feature notes

- **Mix**: `?u=a&with=b` renders a blended face via `mixFace` (traits inherited one side each, continuous values averaged, seed derived from both names). `mixName` derives the display name.
- **Dark mode**: `localStorage["df-theme"]`, falls back to `prefers-color-scheme`, default light. Toggle in hero.
- **Fonts**: brand = Caveat, inputs = Gochi Hand, UI = mono. Google Fonts loaded non-blocking (`media="print" onload`) — keep it that way to avoid FOUC.
- **Tailwind v4**: tokens in `@theme` (`--color-*`, `--font-*`), dark palette via `html[data-theme="dark"]` overrides. Preflight resets custom width/margin — re-check container spacing after refactors.

## Explicitly rejected (don't re-propose)

- React / any JS framework
- shadcn/ui
- Bun
- Adding test frameworks for canvas code
