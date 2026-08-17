import type { Proj, Pt, Pt3 } from "./types.js";

export function resample(pts: Pt[], step: number): Pt[] {
  if (pts.length < 2) return pts.slice();
  const out: Pt[] = [[pts[0][0], pts[0][1]]];
  let need = step;
  for (let i = 1; i < pts.length; i++) {
    let x0 = pts[i - 1][0], y0 = pts[i - 1][1];
    const x1 = pts[i][0], y1 = pts[i][1];
    let d = Math.hypot(x1 - x0, y1 - y0);
    while (d >= need && d > 0) {
      const t = need / d;
      x0 += (x1 - x0) * t;
      y0 += (y1 - y0) * t;
      out.push([x0, y0]);
      d = Math.hypot(x1 - x0, y1 - y0);
      need = step;
    }
    need -= d;
  }
  const last = pts[pts.length - 1], le = out[out.length - 1];
  if (Math.hypot(last[0] - le[0], last[1] - le[1]) > step * 0.25) out.push([last[0], last[1]]);
  return out;
}

export function chaikin(pts: Pt[], closed: boolean, it: number): Pt[] {
  let cur = pts;
  while (it-- > 0) {
    const out: Pt[] = [];
    const n = cur.length;
    if (!closed) out.push(cur[0]);
    const end = closed ? n : n - 1;
    for (let i = 0; i < end; i++) {
      const a = cur[i], b = cur[(i + 1) % n];
      out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
      out.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    if (!closed) out.push(cur[n - 1]);
    cur = out;
  }
  return cur;
}

export function smooth(pts: Pt[], closed: boolean, samples = 8): Pt[] {
  return chaikin(pts, closed, Math.max(1, Math.round(samples / 4)));
}

export function arc3(
  cx: number, cy: number, r: number, a0: number, a1: number, z: number, n = 10, squash = 1,
): Pt3[] {
  const pts: Pt3[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * squash, z]);
  }
  return pts;
}

export function makeProj(cx: number, cy: number, S: number, yaw: number, pitch: number): Proj {
  const cyw = Math.cos(yaw), syw = Math.sin(yaw);
  const cpt = Math.cos(pitch), spt = Math.sin(pitch);
  return (x, y, z = 0) => {
    const x1 = x * cyw + z * syw;
    const z1 = -x * syw + z * cyw;
    const y1 = y * cpt - z1 * spt;
    return [cx + x1 * S, cy + y1 * S];
  };
}

export function P(proj: Proj, pts: Pt3[]): Pt[] {
  return pts.map((p) => proj(p[0], p[1], p[2]));
}

export function visible(x: number, yaw: number): boolean {
  return x * Math.sin(yaw) > -0.55;
}

export function pin(x: number, y: number, hrx: number, hry: number, pad = 0.12): [number, number] {
  const nx = x / Math.max(0.01, hrx * (1 - pad));
  const ny = y / Math.max(0.01, hry * (1 - pad));
  const d = Math.hypot(nx, ny);
  if (d <= 1) return [x, y];
  return [x / d, y / d];
}
