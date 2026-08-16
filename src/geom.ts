import type { Proj, Pt, Pt3 } from "./types";

export function smooth(pts: Pt[], closed: boolean, samples = 8): Pt[] {
  if (pts.length < 2) return pts.slice();
  const p = pts.slice();
  if (closed) {
    p.unshift(pts[pts.length - 1]);
    p.push(pts[0], pts[1]);
  } else {
    p.unshift(pts[0]);
    p.push(pts[pts.length - 1]);
  }
  const out: Pt[] = [];
  const segs = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = p[i], p1 = p[i + 1], p2 = p[i + 2], p3 = p[i + 3];
    for (let j = 0; j < samples; j++) {
      const t = j / samples, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  if (!closed) out.push(pts[pts.length - 1]);
  return out;
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

// far-side drop + keep features on the skull disk
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
