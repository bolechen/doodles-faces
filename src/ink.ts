import { smooth } from "./geom";
import type { InkOpt, Pt, Rng } from "./types";

export function ink(ctx: CanvasRenderingContext2D, pts: Pt[], rng: Rng, o: InkOpt = {}): void {
  const width = o.width ?? 2.6, color = o.color ?? "#241f1a";
  const jitter = o.jitter ?? 1.2, passes = o.passes ?? 2;
  const closed = !!o.closed, taper = !!o.taper, alpha = o.alpha ?? 1;
  const path = o.smooth === false ? pts.slice() : smooth(pts, closed, o.samples ?? 8);
  if (path.length < 2) return;
  const ph = rng() * 10;
  const W = path.map((p, i) => {
    const n = Math.sin(i * 0.55 + ph) * 0.6 + Math.sin(i * 0.19 + ph * 1.7) * 0.4;
    const m = Math.cos(i * 0.5 + ph * 1.3) * 0.6 + Math.sin(i * 0.27 + ph) * 0.4;
    return [p[0] + n * jitter, p[1] + m * jitter] as Pt;
  });
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let pass = 0; pass < passes; pass++) {
    const ox = pass ? (rng() * 2 - 1) * 1.6 : 0;
    const oy = pass ? (rng() * 2 - 1) * 1.6 : 0;
    for (let i = 0; i < W.length - 1; i++) {
      const t = i / (W.length - 1);
      const pres = taper
        ? Math.sin(Math.PI * t) * 0.8 + 0.35
        : 0.7 + 0.5 * Math.sin(i * 0.7 + ph) + 0.12 * Math.sin(i * 1.9 + ph * 2);
      ctx.globalAlpha = alpha * (pass ? 0.42 : 0.9);
      ctx.lineWidth = Math.max(0.5, width * pres * (0.8 + rng() * 0.55));
      ctx.beginPath();
      ctx.moveTo(W[i][0] + ox + (rng() * 2 - 1) * 0.85, W[i][1] + oy + (rng() * 2 - 1) * 0.85);
      ctx.lineTo(W[i + 1][0] + ox + (rng() * 2 - 1) * 0.85, W[i + 1][1] + oy + (rng() * 2 - 1) * 0.85);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function patch(
  ctx: CanvasRenderingContext2D, pts: Pt[], color: string, rng: Rng,
  o: { alpha?: number; dx?: number; dy?: number } = {},
): void {
  if (pts.length < 3) return;
  const path = smooth(pts, true, 7);
  const dx = o.dx ?? (rng() * 2 - 1) * 3;
  const dy = o.dy ?? (rng() * 2 - 1) * 3;
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 0.94;
  ctx.fillStyle = color;
  ctx.beginPath();
  path.forEach((p, i) => (i ? ctx.lineTo(p[0] + dx, p[1] + dy) : ctx.moveTo(p[0] + dx, p[1] + dy)));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function blob(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// dry-brush grain overlay, cached per size
const grainCache = new Map<string, HTMLCanvasElement>();

export function grain(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number): void {
  const key = `${w}x${h}`;
  let c = grainCache.get(key);
  if (!c) {
    c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const gx = c.getContext("2d");
    if (!gx) return;
    const img = gx.createImageData(w, h);
    const d = img.data;
    let a = (seed ^ 99) >>> 0;
    const rng = () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = 0; i < d.length; i += 4) {
      const v = (rng() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 14;
    }
    gx.putImageData(img, 0, 0);
    grainCache.set(key, c);
  }
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(c, 0, 0);
  ctx.restore();
}

export function paper(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number): void {
  ctx.fillStyle = "#e9e4d8";
  ctx.fillRect(0, 0, w, h);
  let a = (seed ^ 0x9e3779b9) >>> 0;
  const rng = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < 18; i++) {
    const x = rng() * w, y = rng() * h, rr = (0.12 + rng() * 0.4) * w;
    const rad = ctx.createRadialGradient(x, y, 0, x, y, rr);
    rad.addColorStop(0, "rgba(120,100,70,0.035)");
    rad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rad;
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, 7);
    ctx.fill();
  }
}
