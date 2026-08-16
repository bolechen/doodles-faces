# doodles-faces

Type a **username** → get a hand-drawn ink avatar.  
Same name → same face. Canvas + TypeScript, no AI.

Inspired by [@mannay](https://x.com/mannay/status/2087522034351796728): parts are code, pinned on a rough 3D skull.

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

Vite static output in `dist/`. `vercel.json` points the build there.

## Layout

```
src/
  types.ts   # Face DNA
  rng.ts     # mulberry32 + FNV
  geom.ts    # 3D project / pin-to-skull
  ink.ts     # dry-brush + paper grain
  face.ts    # seed → traits
  draw.ts    # painters (add a variant here)
  main.ts    # username UI
```
