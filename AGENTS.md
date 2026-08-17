# AGENTS.md

Workflow rules for AI agents working in this repo.

## Tooling

- **Package manager**: pnpm (never npm). Build: `pnpm build` (= `tsc --noEmit && vite build`). Dev: `pnpm dev`.
- **Testing**: vitest (`pnpm test`). `src/face.test.ts` locks determinism (hash/rng/face/mix) and the src ↔ `api/_lib/dna` sync — run it after touching `face.ts` / `rng.ts` / `dna.ts`. Only pure functions are tested, never canvas rendering.
- **Formatting/lint**: none configured. Match existing style (Biome-style, no semicolons avoided — follow the file's own conventions).

## Git workflow

- **Branches**: work on `dev`, open a PR to `main`. Squash merge.
- **Commits**: conventional commits (`feat:`, `fix:`, `ui:`, `chore:`, `docs:`).
- **DO NOT commit or push unless the user explicitly says so.** Show local preview (`pnpm preview`) and wait for confirmation.
- Deploy is handled by Vercel Git integration: push to `main` → production, push to `dev`/PR → preview. Never run `vercel --prod` manually.

## Critical invariants

### `api/_lib/*` mirrors the drawing modules

Vercel cannot bundle `../src/*` into serverless functions, so the OG endpoint
(`api/og.ts`, node runtime + `@napi-rs/canvas`) ships its own DOM-free copies:
`dna.ts` (seed → traits), `draw.ts`, `geom.ts`, `ink.ts`, `types.ts`.

**When you change `src/face.ts` (traits, weights), the palette constants in
`src/ink.ts`, or any drawing logic, you MUST mirror the change in
`api/_lib/dna.ts` / `draw.ts` / `ink.ts` / `geom.ts`.** Otherwise the page and
the OG card render different faces for the same name. `mixFace` lives only in
`src/face.ts` — the OG endpoint renders single faces and does not need it.

Keep relative imports in `api/` extensioned (`./_lib/dna.js`) — the node
runtime is ESM and Vercel compiles each `.ts` to `.js`.

### Determinism is the product

"Same name, same face" is the core promise. Never change `mulberry32`, `hashStr`, trait weights, or face building in a way that changes output for an existing seed without explicit approval. Tests should lock determinism if added.

## Feature notes

- **Mix**: `?u=a&with=b` renders a blended face via `mixFace` (traits inherited one side each, continuous values averaged, seed derived from both names). Display label is `name × with`; `drawMix` is the shared canvas renderer.
- **Dark mode**: `localStorage["df-theme"]`, falls back to `prefers-color-scheme`, default light. Toggle in hero.
- **Fonts**: brand = Caveat, inputs = Gochi Hand, UI = mono. Google Fonts loaded non-blocking (`media="print" onload`) — keep it that way to avoid FOUC.
- **Tailwind v4**: tokens in `@theme` (`--color-*`, `--font-*`), dark palette via `html[data-theme="dark"]` overrides. Preflight resets custom width/margin — re-check container spacing after refactors.

## Explicitly rejected (don't re-propose)

- React / any JS framework
- shadcn/ui
- Bun
- Adding test frameworks for canvas code
