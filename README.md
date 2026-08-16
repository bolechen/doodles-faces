# doodles faces

Type a name. Get a graphite doodle. Same name, same face.

Pure canvas + TypeScript. No AI, no framework.

## Use

- Type a name → unique portrait (`?u=ada`)
- Optional `with=` draws two heads on one sheet
- Crowd view: a 5×3 sheet, click a cell to reroll it
- Share copies the URL and, when the browser allows it, a 1200×630 card
- Save PNG exports the card (or the crowd sheet)

## Dev

```bash
pnpm i
pnpm dev
```

## Build / Vercel

```bash
pnpm build
pnpm dlx vercel
pnpm dlx vercel --prod
```

Static output in `dist/`. `vercel.json` installs with pnpm and publishes that folder.

## Layout

```
src/
  types.ts   Face DNA
  rng.ts     mulberry32 + FNV
  geom.ts    3D project / pin-to-skull / graphite path
  ink.ts     ribbon stroke, paper, grain, washes
  face.ts    seed → traits
  draw.ts    painters + share card + crowd
  main.ts    desk UI
```
