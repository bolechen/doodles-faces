# doodles faces

Type a name. Get a graphite doodle. **Same name, same face.**

A seeded face generator drawn entirely in the browser. Type any username and
you get a unique hand-drawn face: a wobbly skull, solid ink hair, tired eyes,
and the occasional eye patch or visor. Same name always produces the same face.

No AI. No image assets. Just canvas, TypeScript, and a seeded random number
generator.

**[→ Try it live: doodlefaces.site](https://doodlefaces.site)**

---

## Why

[Mannay](https://x.com/mannay/status/2087522034351796728) once said
"you can just draw faces with javascript" and shared sketchbook after
sketchbook of faces that were pure code. This is an independent,
clean-room take on that technique: features are painter functions,
assembled onto a rough 3D skull, roughed up with a graphite stroke engine.

**What makes it fun**
- A name is a seed. Share `?u=ada` and everyone sees the same ada.
- Mix two people with `?u=ada&with=bob`: a blended face that inherits traits
  from both, shareable as an `ada × bob` card.
- Crowd view renders a 5×3 sheet; click any cell and that person changes.
- Every face comes with a trait caption (`gaunt · round · none · seam`).

## Features

| Mode | What it does |
|---|---|
| Portrait | One graphite head from a username (`?u=name`) |
| Mix | A blended face from two names (`?u=a&with=b`) |
| Crowd | A 5×3 sheet of faces from one seed (`?view=crowd`) |
| Share | Web Share API with a 1200×630 PNG card, or a copyable link |
| Save | Download the card or the crowd sheet as PNG |

## Tech

- **Seeded RNG** — mulberry32 + FNV-1a hash. Deterministic, no network.
- **3D skull pinning** — features live on a rough head and follow yaw/pitch
  instead of sliding around in 2D.
- **Graphite engine** — ribbon strokes with variable width, dry granulation,
  paper grain, and muted color washes. Everything is drawn, nothing is loaded.
- **Dynamic OG** — `/api/og?u=name` renders the real graphite face server-side
  (`@napi-rs/canvas`, node runtime) for social previews. Same name, same face,
  same card.

## Dev

```bash
pnpm i
pnpm dev
```

## Build / Deploy

```bash
pnpm build            # typecheck + vite build into dist/
pnpm dlx vercel --prod
```

Static output lives in `dist/`; `vercel.json` installs with pnpm and
publishes that folder. The OG endpoint is a Node function in `api/og.ts`
(`@napi-rs/canvas`, runtime "nodejs").

## Layout

```
api/
  og.ts        dynamic social card per username (serverless)
public/
  og.png       static fallback, icons, robots.txt, sitemap.xml
src/
  types.ts     Face DNA
  rng.ts       mulberry32 + FNV hash
  geom.ts      3D projection, pin-to-skull, path smoothing
  ink.ts       graphite stroke, paper, grain, washes
  face.ts      seed → traits
  draw.ts      painters, share card, crowd sheet
  main.ts      desk UI + i18n-ready strings
```

## License

[MIT](./LICENSE) — do whatever you want. A credit link back is always
appreciated.
