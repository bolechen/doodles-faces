import { chaikin, resample } from "./geom";
import type { InkOpt, Pt, Rng } from "./types";

export const PAPER = "#f3eee2";
export const INK_RGB: [number, number, number] = [31, 29, 26];

export const HALOS = ["#a8b0a0", "#b7bcc9", "#c3bfc8", "#b8b2a6", "#b3c2cc", "#cbb4b0", "#d8d2bf"];
export const SKINS = ["#8a5d42", "#a4714f", "#c08a5c", "#e3c9a0", "#d9a98f", "#9c8878", "#ddc687"];
export const HAIRS = ["#aa6030", "#b49648", "#5c8478", "#5c688c", "#8c6058"];
export const ACCENTS = ["#a8483c", "#568278", "#b2863a"];

function inkA(a: number, boost = 1): string {
  return `rgba(${INK_RGB[0]},${INK_RGB[1]},${INK_RGB[2]},${Math.min(1, a * boost)})`;
}
function paperA(a: number): string {
  return `rgba(246,241,229,${a})`;
}

export function ink(ctx: CanvasRenderingContext2D, pts: Pt[], rng: Rng, o: InkOpt = {}): void {
  const w = o.width ?? 2.6;
  const alpha = o.alpha ?? (0.68 + rng() * 0.29);
  const boost = o.boost ?? 1;
  const taper = o.taper ? 0.28 : 0.22;
  let path = o.smooth === false ? pts.slice() : chaikin(pts, !!o.closed, 1);
  if (path.length < 2) return;

  const rs = resample(path, Math.max(2.2, w * 0.9));
  const n = rs.length;
  if (n < 3) {
    ctx.save();
    ctx.strokeStyle = o.color ?? inkA(alpha, boost);
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(path[0][0], path[0][1]);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i][0], path[i][1]);
    if (o.closed) ctx.closePath();
    ctx.stroke();
    ctx.restore();
    return;
  }

  const amp = w * 0.5 + 0.9;
  const p1 = rng() * 7, p2 = rng() * 7, p3 = rng() * 7, p4 = rng() * 7;
  const f1 = 1.5 + rng() * 2, f2 = 5 + rng() * 4, f3 = 11 + rng() * 6;
  const L: Pt[] = [], Rt: Pt[] = [];
  const C: { x: number; y: number; nx: number; ny: number; half: number }[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const a = rs[Math.max(0, i - 1)], b = rs[Math.min(n - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0];
    const d = Math.hypot(nx, ny) || 1;
    nx /= d; ny /= d;
    const off = amp * (0.55 * Math.sin(t * f1 * 2 + p1) + 0.3 * Math.sin(t * f2 + p2) + 0.15 * Math.sin(t * f3 + p3));
    const px = rs[i][0] + nx * off + (rng() - 0.5) * 0.7;
    const py = rs[i][1] + ny * off + (rng() - 0.5) * 0.7;
    const edge = Math.min(t, 1 - t) / taper;
    const s = edge < 1 ? edge * edge * (3 - 2 * edge) : 1;
    let half = (w / 2) * (0.3 + 0.7 * s) * (1 + 0.38 * Math.sin(t * 7.3 + p4) + 0.14 * Math.sin(t * 19 + p2)) * (0.88 + rng() * 0.26);
    half = Math.max(half, 0.28);
    L.push([px + nx * half, py + ny * half]);
    Rt.push([px - nx * half, py - ny * half]);
    C.push({ x: px, y: py, nx, ny, half });
  }

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < n; i++) ctx.lineTo(L[i][0], L[i][1]);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(Rt[i][0], Rt[i][1]);
  ctx.closePath();
  ctx.fillStyle = o.color ?? inkA(alpha * 0.62, boost);
  ctx.fill();

  if (w >= 1.2) {
    for (const c of C) {
      const nd = Math.min(4, Math.max(1, Math.round(c.half * 1.5)));
      for (let k = 0; k < nd; k++) {
        if (rng() < 0.3) continue;
        const u = rng() * 2.1 - 1.05;
        const sz = 0.7 + rng() * 0.8;
        ctx.fillStyle = inkA(alpha * (0.2 + rng() * 0.35), boost);
        ctx.fillRect(c.x + c.nx * c.half * u - sz / 2, c.y + c.ny * c.half * u - sz / 2, sz, sz);
      }
      if (rng() < 0.45) {
        const u = (rng() < 0.5 ? 1 : -1) * (0.8 + rng() * 0.35);
        const sz = 0.9 + rng() * 1.1;
        ctx.fillStyle = paperA(0.4 + rng() * 0.4);
        ctx.fillRect(c.x + c.nx * c.half * u - sz / 2, c.y + c.ny * c.half * u - sz / 2, sz, sz);
      }
    }
  }
  ctx.restore();

  if (o.ghost && rng() < 0.55) {
    ink(ctx, pts, rng, { ...o, width: w * 0.42, alpha: alpha * 0.18, ghost: false, jitter: 2 });
  }
}

export function patch(
  ctx: CanvasRenderingContext2D, pts: Pt[], color: string, rng: Rng,
  o: { alpha?: number; dx?: number; dy?: number } = {},
): void {
  if (pts.length < 3) return;
  const path = chaikin(pts, true, 1);
  const dx = o.dx ?? (rng() * 2 - 1) * 2;
  const dy = o.dy ?? (rng() * 2 - 1) * 2;
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 0.9;
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

export function wash(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, color: string, rng: Rng): void {
  ctx.save();
  ctx.globalAlpha = 0.14 + rng() * 0.1;
  ctx.fillStyle = color;
  ctx.beginPath();
  const n = 18, ph = rng() * 7;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const m = 1 + 0.06 * Math.sin(t * 3 + ph);
    const x = cx + Math.cos(t) * rx * m;
    const y = cy + Math.sin(t) * ry * m;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function paper(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number): void {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);
  let a = (seed ^ 0x9e3779b9) >>> 0;
  const rng = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < 14; i++) {
    const x = rng() * w, y = rng() * h, rr = (0.12 + rng() * 0.4) * w;
    const rad = ctx.createRadialGradient(x, y, 0, x, y, rr);
    rad.addColorStop(0, "rgba(120,100,70,0.03)");
    rad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rad;
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, 7);
    ctx.fill();
  }
  // fold crease
  if (rng() < 0.8) {
    const vert = rng() < 0.55;
    const pos = (0.18 + rng() * 0.64) * (vert ? w : h);
    ctx.save();
    ctx.strokeStyle = "rgba(84,76,62,0.07)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let k = 0; k <= 20; k++) {
      const t = k / 20;
      const main = pos + Math.sin(t * 2.4) * 12;
      const x = vert ? main : t * w;
      const y = vert ? t * h : main;
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }
}
