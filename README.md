# doodles-faces

Type a **username** → get a hand-drawn ink avatar.  
Same name → same face. Pure JS canvas, no AI, no build.

Inspired by [@mannay](https://x.com/mannay/status/2087522034351796728).

## Use

- Type in the input (debounced 180ms) → face updates
- **rnd** — random name
- **share** — Web Share API, else copy `?u=name` link
- **download** — PNG

Share URL: `https://yoursite/?u=ada`

## Run

```bash
open index.html
# or
npx serve .
```

## Deploy (Vercel)

```bash
npx vercel
npx vercel --prod
```
