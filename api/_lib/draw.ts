import { arc3, makeProj, P, pin, visible } from "./geom";
import { blob, ink, paper, patch, wash } from "./ink";
import { buildFace, headPath, mulberry32 } from "./dna";
import type { Face, Proj, Pt3, Rng } from "./types";

function clampOnSkull(T: Face, x: number, y: number): [number, number] {
  return pin(x, y, T.hrx, T.hry, 0.14);
}

function drawBrows(ctx: CanvasRenderingContext2D, proj: Proj, lE: Pt3, rE: Pt3, s: number, T: Face, rng: Rng, C: string): void {
  if (T.brow === "none") return;
  const y = lE[1] - 0.2, z = 0.24;
  if (T.brow === "uni") {
    ink(ctx, P(proj, [[lE[0] - 0.16, y, z], [rE[0] + 0.16, y - 0.01, z]]), rng, { width: 5 * s, passes: 2, jitter: 0.9, color: C });
    return;
  }
  for (const E of [lE, rE]) {
    if (!visible(E[0], T.yaw)) continue;
    const dir = E === lE ? -1 : 1;
    if (T.brow === "raise") {
      ink(ctx, P(proj, arc3(E[0], y + 0.12, 0.17, Math.PI * 1.15, Math.PI * 1.85, z, 6)), rng, { width: 2.8 * s, passes: 2, jitter: 0.8, color: C });
    } else if (T.brow === "tired") {
      ink(ctx, P(proj, [[E[0] - 0.16 * dir, y - 0.03, z], [E[0] + 0.16 * dir, y + 0.05, z]]), rng, { width: 2.8 * s, passes: 2, jitter: 0.8, color: C });
    } else if (T.brow === "worry") {
      ink(ctx, P(proj, [[E[0] - 0.16 * dir, y + 0.05, z], [E[0] + 0.16 * dir, y - 0.03, z]]), rng, { width: 2.8 * s, passes: 2, jitter: 0.8, color: C });
    } else {
      ink(ctx, P(proj, [[E[0] - 0.15, y, z], [E[0] + 0.15, y - 0.01, z]]), rng, { width: 2.8 * s, passes: 2, jitter: 0.8, color: C });
    }
  }
}

function drawEye(ctx: CanvasRenderingContext2D, proj: Proj, E: Pt3, s: number, T: Face, rng: Rng, C: string, side: number): void {
  const [x, y, z] = E, R = 0.17;
  const [px, py] = proj(x, y, z);
  if (T.eyes === "squint") {
    ink(ctx, P(proj, [[x - R, y, z], [x + R, y, z]]), rng, { width: 2.6 * s, passes: 2, jitter: 0.7, color: C });
    return;
  }
  if (T.eyes === "hollow") {
    ink(ctx, P(proj, arc3(x, y, R, 0, Math.PI * 2, z, 14).slice(0, 14)), rng, { width: 2.6 * s, closed: true, passes: 2, jitter: 0.9, color: C });
    return;
  }
  if (T.eyes === "dead") {
    ink(ctx, P(proj, [[x - R, y - 0.02, z], [x, y - 0.05, z], [x + R, y - 0.02, z]]), rng, { width: 3 * s, passes: 2, jitter: 0.8, color: C });
    ink(ctx, P(proj, arc3(x, y, R, 0.08, Math.PI - 0.08, z, 8, 0.75)), rng, { width: 2.4 * s, passes: 2, jitter: 0.7, color: C });
    const p = proj(x, y + R * 0.4, z);
    blob(ctx, p[0], p[1], R * 56 * s, C);
    return;
  }
  if (T.eyes === "side") {
    ink(ctx, P(proj, arc3(x, y, R, 0.08, Math.PI - 0.08, z, 8, 0.85)), rng, { width: 2.6 * s, passes: 2, jitter: 0.8, color: C });
    ink(ctx, P(proj, arc3(x, y, R, Math.PI + 0.08, Math.PI * 2 - 0.08, z, 8, 0.85)), rng, { width: 2.4 * s, passes: 2, jitter: 0.8, color: C });
    const p = proj(x + side * R * 0.42, y, z);
    blob(ctx, p[0], p[1], R * 62 * s, C);
    return;
  }
  const rw = T.eyes === "wide" ? R * 1.15 : R;
  ink(ctx, P(proj, arc3(x, y, rw, 0.06, Math.PI - 0.06, z, 9, 0.85)), rng, { width: 2.6 * s, passes: 2, jitter: 0.85, color: C });
  ink(ctx, P(proj, arc3(x, y, rw, Math.PI + 0.06, Math.PI * 2 - 0.06, z, 9, 0.85)), rng, { width: 2.5 * s, passes: 2, jitter: 0.85, color: C });
  blob(ctx, px + (rng() - 0.5) * 2, py + (rng() - 0.5) * 2, R * 68 * s, C);
  if (T.eyes === "bags") {
    ink(ctx, P(proj, arc3(x, y + R * 1.1, R * 0.9, 0.2, Math.PI - 0.2, z, 6)), rng, { width: 1.8 * s, passes: 1, jitter: 0.6, color: C });
  }
}

function drawNose(ctx: CanvasRenderingContext2D, proj: Proj, aS: number, s: number, T: Face, rng: Rng, C: string): void {
  const x = aS * 0.6, top = -0.05, tip = 0.22, z = 0.52;
  if (T.nose === "line") {
    ink(ctx, P(proj, [[x, top, z], [x - 0.02, tip, z]]), rng, { width: 2.5 * s, passes: 2, jitter: 0.8, color: C, taper: true });
  } else if (T.nose === "hook") {
    ink(ctx, P(proj, [[x + 0.02, top, 0.4], [x - 0.03, 0.1, 0.55], [x - 0.02, tip, 0.55], [x + 0.12, tip + 0.02, 0.5]]), rng, { width: 2.7 * s, passes: 2, jitter: 0.9, color: C, taper: true });
  } else if (T.nose === "long") {
    ink(ctx, P(proj, [[x, top - 0.05, 0.42], [x - 0.02, 0.12, 0.55], [x, tip + 0.05, 0.5], [x + 0.1, tip + 0.06, 0.48]]), rng, { width: 2.6 * s, passes: 2, jitter: 0.9, color: C });
  } else if (T.nose === "button") {
    ink(ctx, P(proj, arc3(x, tip - 0.02, 0.09, 0.15, Math.PI - 0.15, z, 8)), rng, { width: 2.5 * s, passes: 2, jitter: 0.7, color: C });
  } else if (T.nose === "wide") {
    ink(ctx, P(proj, [[x - 0.02, top, 0.45], [x - 0.04, tip, 0.55], [x - 0.14, tip + 0.04, 0.48]]), rng, { width: 2.5 * s, passes: 2, jitter: 0.85, color: C });
    ink(ctx, P(proj, [[x - 0.04, tip, 0.55], [x + 0.12, tip + 0.03, 0.48]]), rng, { width: 2.5 * s, passes: 2, jitter: 0.85, color: C });
  } else if (T.nose === "bulb") {
    ink(ctx, P(proj, [[x, top, 0.45], [x - 0.02, 0.1, 0.55]]), rng, { width: 2.4 * s, passes: 2, jitter: 0.8, color: C });
    ink(ctx, P(proj, arc3(x, tip, 0.1, 0, Math.PI * 2, 0.55, 12).slice(0, 12)), rng, { width: 2.4 * s, closed: true, passes: 2, jitter: 0.85, color: C });
  } else {
    ink(ctx, P(proj, [[x + 0.04, top - 0.02, 0.42], [x - 0.06, 0.14, 0.6], [x + 0.2, tip + 0.02, 0.5]]), rng, { width: 2.7 * s, passes: 2, jitter: 0.9, color: C, taper: true });
  }
}

function drawMouth(ctx: CanvasRenderingContext2D, proj: Proj, aS: number, s: number, T: Face, rng: Rng, C: string): void {
  const x = aS, y = 0.45, z = 0.4;
  if (T.mouth === "open") {
    const o = P(proj, arc3(x, y + 0.02, 0.13, 0, Math.PI * 2, z, 14, 1.3).slice(0, 14));
    ink(ctx, o, rng, { width: 2.4 * s, closed: true, passes: 2, jitter: 0.8, color: C });
    patch(ctx, o, "#5a3230", rng, { alpha: 0.45, dx: 0, dy: 0 });
  } else if (T.mouth === "smile") {
    ink(ctx, P(proj, arc3(x, y - 0.06, 0.24, 0.13, Math.PI - 0.13, z, 8)), rng, { width: 2.5 * s, passes: 2, jitter: 0.8, color: C });
    ink(ctx, P(proj, [[x - 0.24, y - 0.04, z], [x - 0.25, y - 0.12, z]]), rng, { width: 1.6 * s, passes: 1, jitter: 0.5, color: C });
    ink(ctx, P(proj, [[x + 0.24, y - 0.04, z], [x + 0.25, y - 0.12, z]]), rng, { width: 1.6 * s, passes: 1, jitter: 0.5, color: C });
  } else if (T.mouth === "frown") {
    ink(ctx, P(proj, arc3(x, y + 0.13, 0.16, Math.PI + 0.25, Math.PI * 2 - 0.25, z, 8)), rng, { width: 2.5 * s, passes: 2, jitter: 0.8, color: C });
  } else if (T.mouth === "smirk") {
    ink(ctx, P(proj, [[x - 0.2, y + 0.03, z], [x + 0.05, y, z], [x + 0.22, y - 0.08, z]]), rng, { width: 2.6 * s, passes: 2, jitter: 0.85, color: C });
  } else if (T.mouth === "grim") {
    ink(ctx, P(proj, [[x - 0.22, y - 0.02, z], [x, y + 0.02, z], [x + 0.22, y - 0.02, z]]), rng, { width: 2.6 * s, passes: 2, jitter: 0.8, color: C });
    ink(ctx, P(proj, [[x - 0.22, y - 0.02, z], [x - 0.24, y + 0.04, z]]), rng, { width: 1.6 * s, passes: 1, jitter: 0.5, color: C });
    ink(ctx, P(proj, [[x + 0.22, y - 0.02, z], [x + 0.24, y + 0.04, z]]), rng, { width: 1.6 * s, passes: 1, jitter: 0.5, color: C });
  } else {
    ink(ctx, P(proj, [[x - 0.2, y, z], [x + 0.2, y - 0.01, z]]), rng, { width: 2.5 * s, passes: 2, jitter: 0.75, color: C });
  }
}

function drawFacial(ctx: CanvasRenderingContext2D, proj: Proj, aS: number, s: number, T: Face, rng: Rng, C: string): void {
  const x = aS, y = 0.45, z = 0.4;
  if (T.facial === "mustache") {
    ink(ctx, P(proj, [[x - 0.16, y - 0.08, z], [x, y - 0.02, z], [x + 0.16, y - 0.08, z]]), rng, { width: 4.2 * s, passes: 2, jitter: 1, color: C });
  } else if (T.facial === "goatee") {
    const g = P(proj, [[x - 0.07, y + 0.08, z], [x, y + 0.22, z], [x + 0.07, y + 0.08, z]]);
    patch(ctx, g, C, rng, { alpha: 0.92 });
    ink(ctx, g, rng, { width: 2 * s, closed: true, passes: 2, jitter: 0.8, color: C });
  } else if (T.facial === "stubble") {
    for (let i = 0; i < 22; i++) {
      const sx = x + (rng() * 2 - 1) * 0.18;
      const sy = y + rng() * 0.16 - 0.02;
      ink(ctx, P(proj, [[sx, sy, z], [sx + (rng() * 2 - 1) * 0.015, sy + 0.02 + rng() * 0.02, z]]), rng, {
        width: 1.1, passes: 1, jitter: 0.3, color: C, smooth: false,
      });
    }
  }
}

function drawGlasses(ctx: CanvasRenderingContext2D, proj: Proj, lE: Pt3, rE: Pt3, s: number, T: Face, rng: Rng, C: string): void {
  const k = T.glasses, z = 0.3, rr = 0.22;
  for (const E of [lE, rE]) {
    if (!visible(E[0], T.yaw)) continue;
    if (k === "square" || k === "shades") {
      const box: Pt3[] = [
        [E[0] - rr, E[1] - rr * 0.75, z], [E[0] + rr, E[1] - rr * 0.75, z],
        [E[0] + rr, E[1] + rr * 0.75, z], [E[0] - rr, E[1] + rr * 0.75, z],
      ];
      const pbox = P(proj, box);
      if (k === "shades") patch(ctx, pbox, "#2a251f", rng, { alpha: 0.82, dx: 0, dy: 0 });
      ink(ctx, pbox, rng, { width: 2.4 * s, closed: true, passes: 2, jitter: 0.55, color: C });
    } else {
      ink(ctx, P(proj, arc3(E[0], E[1], rr, 0, Math.PI * 2, z, 16, 0.85).slice(0, 16)), rng, { width: 2.3 * s, closed: true, passes: 2, jitter: 0.55, color: C });
    }
  }
  ink(ctx, P(proj, [[lE[0] + rr, lE[1], z], [rE[0] - rr, rE[1], z]]), rng, { width: 1.8 * s, passes: 1, jitter: 0.4, color: C });
}

function drawHair(ctx: CanvasRenderingContext2D, proj: Proj, s: number, T: Face, rng: Rng, C: string): void {
  if (T.hair === "none") return;
  const rx = T.hrx, ry = T.hry, crown = -ry * 0.86, z = 0.03;

  const cap = (spread: number, fringeY: number, jag: number, n = 16) => {
    const pts: Pt3[] = [];
    for (let i = 0; i <= n; i++) {
      const a = Math.PI + Math.PI * (i / n);
      pts.push([Math.cos(a) * rx * spread, Math.sin(a) * ry * spread, z]);
    }
    for (let i = n; i >= 0; i--) {
      const t = i / n;
      pts.push([(-1 + 2 * t) * rx * spread, fringeY - Math.sin(t * Math.PI) * 0.05 + (rng() * 2 - 1) * jag, z]);
    }
    const p = P(proj, pts);
    patch(ctx, p, C, rng, { alpha: 0.96 });
    ink(ctx, p, rng, { width: 2.2 * s, closed: true, passes: 2, jitter: 1.1, color: C });
  };
  const hatch = (spread: number, y0: number, y1: number, dens: number) => {
    for (let i = 0; i < dens; i++) {
      const x = (-1 + 2 * i / dens) * rx * spread * 0.96;
      ink(ctx, P(proj, [[x, y0 + (rng() * 2 - 1) * 0.03, z], [x + (rng() * 2 - 1) * 0.03, y1 + (rng() * 2 - 1) * 0.04, z]]), rng, {
        width: 1.5 * s, passes: 1, jitter: 0.4, color: C,
      });
    }
  };
  const curls = (spread: number, y0: number, y1: number, dens: number) => {
    for (let i = 0; i < dens; i++) {
      const x = (-1 + 2 * ((i % 10) / 10) + (rng() - 0.5) * 0.2) * rx * spread * 0.9;
      const y = y0 + (y1 - y0) * (Math.floor(i / 10) / Math.max(1, Math.floor(dens / 10))) + (rng() - 0.5) * 0.06;
      const rr = 0.045 + rng() * 0.03;
      ink(ctx, P(proj, arc3(x, y, rr, 0, Math.PI * 1.7, z, 6)), rng, { width: 1.7 * s, passes: 1, jitter: 0.5, color: C });
    }
  };

  if (T.hair === "bowl") {
    cap(1.0, crown + 0.42, 0.035);
    hatch(0.92, crown + 0.04, crown + 0.34, 22);
  } else if (T.hair === "buzz") {
    cap(0.98, crown + 0.32, 0.03);
    hatch(0.9, crown + 0.02, crown + 0.28, 28);
  } else if (T.hair === "side") {
    cap(1.02, crown + 0.5, 0.045);
    hatch(0.95, crown + 0.04, crown + 0.42, 24);
  } else if (T.hair === "curl") {
    curls(1.0, crown, crown + 0.5, 42);
  } else if (T.hair === "spikes") {
    cap(0.96, crown + 0.2, 0.03, 12);
    for (let i = 0; i <= 12; i++) {
      const t = i / 12, ang = Math.PI * (1 + t);
      const bx = Math.cos(ang) * rx * 0.9;
      const by = -Math.abs(Math.sin(ang)) * ry * 0.92;
      ink(ctx, P(proj, [[bx, by, 0.05], [bx + (rng() * 2 - 1) * 0.08, by - 0.2 - rng() * 0.13, 0.05]]), rng, {
        width: 2.5 * s, passes: 2, jitter: 0.6, color: C,
      });
    }
  } else if (T.hair === "baldspot") {
    ink(ctx, P(proj, arc3(0, -ry * 0.45, rx * 0.62, Math.PI * 1.08, Math.PI * 1.92, 0.04, 12, 0.35)), rng, {
      width: 2 * s, passes: 1, jitter: 0.6, color: C, alpha: 0.55,
    });
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const bx = side * (rx * 0.55 + i * 0.06);
        const by = -ry * 0.5 + i * 0.05;
        ink(ctx, P(proj, [[bx, by, 0.04], [bx + side * 0.05, by - 0.14, 0.04]]), rng, { width: 2.1 * s, passes: 1, jitter: 0.5, color: C });
      }
    }
  } else if (T.hair === "hat") {
    const brimY = -ry * 0.28;
    const top: Pt3[] = [
      ...arc3(0, -ry * 0.15, rx * 1.08, Math.PI * 1.08, Math.PI * 1.92, 0.02, 12, ry / rx * 0.8),
      [rx * 1.05, brimY, 0.02],
      [-rx * 1.05, brimY, 0.02],
    ];
    const p = P(proj, top);
    patch(ctx, p, C, rng, { alpha: 0.95 });
    ink(ctx, p, rng, { width: 2.4 * s, closed: true, passes: 2, jitter: 1, color: C });
    ink(ctx, P(proj, [[-rx * 1.18, brimY, 0.02], [rx * 1.18, brimY + 0.02, 0.02]]), rng, { width: 4.4 * s, passes: 2, jitter: 0.8, color: C });
    hatch(0.88, -ry * 0.78, brimY - 0.03, 16);
  }
}

export function drawFace(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, T: Face): void {
  const rng = mulberry32((T.seed * 9973 + 13) >>> 0);
  const C = T.ink;
  const proj = makeProj(cx, cy, 168 * s, T.yaw, T.pitch);
  const origin = proj(0, 0, 0);
  if (T.halo) wash(ctx, origin[0], origin[1] - 8 * s, 190 * s * T.hrx, 210 * s * T.hry, T.halo, rng);
  if (T.skin) wash(ctx, origin[0], origin[1] + 6 * s, 150 * s * T.hrx, 170 * s * T.hry, T.skin, rng);

  ink(ctx, P(proj, [[-0.16, T.hry * 0.85, -0.05], [-0.1, T.hry * 1.25, -0.08], [0.1, T.hry * 1.25, -0.08], [0.16, T.hry * 0.85, -0.05]]), rng, {
    width: 2.1 * s, passes: 1, jitter: 0.8, color: C,
  });

  for (const side of [-1, 1] as const) {
    if (!visible(side * T.hrx, T.yaw)) continue;
    const ex = side * T.hrx * 0.98;
    ink(ctx, P(proj, [[ex, -0.14, -0.16], [ex + side * 0.14, 0.02, -0.2], [ex, 0.18, -0.16]]), rng, {
      width: 2.4 * s, passes: 2, jitter: 0.9, color: C,
    });
  }

  ink(ctx, P(proj, headPath(T, rng)), rng, { width: 3.5 * s, closed: true, passes: 3, jitter: 1.5, color: C, samples: 10 });
  drawHair(ctx, proj, s, T, rng, C);

  const aS = T.asym;
  const [lx, ly] = clampOnSkull(T, -0.4 + aS, -0.06);
  const [rx, ry] = clampOnSkull(T, 0.4 + aS, -0.06 - aS * 0.4);
  const lEye: Pt3 = [lx, ly, 0.25];
  const rEye: Pt3 = [rx, ry, 0.25];
  drawBrows(ctx, proj, lEye, rEye, s, T, rng, C);
  if (visible(lEye[0], T.yaw)) drawEye(ctx, proj, lEye, s, T, rng, C, -1);
  if (visible(rEye[0], T.yaw)) drawEye(ctx, proj, rEye, s, T, rng, C, 1);
  if (T.glasses !== "none") drawGlasses(ctx, proj, lEye, rEye, s, T, rng, C);
  drawNose(ctx, proj, aS, s, T, rng, C);
  const [mx] = clampOnSkull(T, aS, 0.45);
  drawMouth(ctx, proj, mx, s, T, rng, C);
  drawFacial(ctx, proj, mx, s, T, rng, C);
  drawMark(ctx, proj, s, T, rng, C);
  drawMod(ctx, proj, lEye, rEye, s, T, rng, C);
}

function drawMark(ctx: CanvasRenderingContext2D, proj: Proj, s: number, T: Face, rng: Rng, C: string): void {
  if (T.mark === "none") return;
  const side = T.yaw >= 0 ? 1 : -1;
  if (T.mark === "scar") {
    ink(ctx, P(proj, [[side * 0.18, -0.08, 0.3], [side * 0.42, 0.18, 0.28]]), rng, { width: 1.8 * s, passes: 1, jitter: 0.5, color: C });
    for (let i = 0; i < 3; i++) {
      const t = 0.2 + i * 0.25;
      const x = side * (0.18 + 0.24 * t);
      const y = -0.08 + 0.26 * t;
      ink(ctx, P(proj, [[x - 0.03, y + 0.02, 0.3], [x + 0.03, y - 0.02, 0.3]]), rng, { width: 1.2 * s, passes: 1, jitter: 0.3, color: C });
    }
  } else if (T.mark === "seam") {
    ink(ctx, P(proj, [[side * 0.52, 0.02, 0.2], [side * 0.54, 0.28, 0.18], [side * 0.42, 0.36, 0.18]]), rng, { width: 1.6 * s, passes: 1, jitter: 0.4, color: C });
  } else {
    for (let i = 0; i < 7; i++) {
      const x = side * (0.32 + i * 0.03);
      ink(ctx, P(proj, [[x, 0.38, 0.28], [x, 0.38 + (i % 3 ? 0.08 : 0.12), 0.28]]), rng, { width: i % 2 ? 1 : 1.8 * s, passes: 1, jitter: 0.2, color: C });
    }
  }
}

function drawMod(ctx: CanvasRenderingContext2D, proj: Proj, lE: Pt3, rE: Pt3, s: number, T: Face, rng: Rng, C: string): void {
  if (T.mod === "none") return;
  const E = T.yaw >= 0 ? rE : lE;
  if (T.mod === "visor") {
    const box: Pt3[] = [[-0.62, -0.14, 0.32], [0.62, -0.14, 0.32], [0.62, 0.12, 0.32], [-0.62, 0.12, 0.32]];
    const p = P(proj, box);
    patch(ctx, p, "#2a251f", rng, { alpha: 0.55, dx: 0, dy: 0 });
    ink(ctx, p, rng, { width: 2 * s, closed: true, passes: 2, jitter: 0.45, color: C });
  } else if (T.mod === "patch") {
    const box: Pt3[] = [[E[0] - 0.2, E[1] - 0.22, 0.32], [E[0] + 0.2, E[1] - 0.22, 0.32], [E[0] + 0.16, E[1] + 0.22, 0.32], [E[0] - 0.16, E[1] + 0.22, 0.32]];
    const p = P(proj, box);
    patch(ctx, p, C, rng, { alpha: 0.9 });
    ink(ctx, p, rng, { width: 2 * s, closed: true, passes: 2, jitter: 0.5, color: C });
    ink(ctx, P(proj, [[E[0] + 0.16, E[1] - 0.18, 0.3], [E[0] > 0 ? -0.7 : 0.7, -0.36, 0.05]]), rng, { width: 1.6 * s, passes: 1, jitter: 0.4, color: C });
  } else {
    ink(ctx, P(proj, arc3(E[0], E[1], 0.16, 0, Math.PI * 2, 0.34, 14).slice(0, 14)), rng, { width: 2 * s, closed: true, passes: 2, jitter: 0.5, color: C });
    ink(ctx, P(proj, arc3(E[0], E[1], 0.08, 0, Math.PI * 2, 0.34, 10).slice(0, 10)), rng, { width: 1.4 * s, closed: true, passes: 1, jitter: 0.35, color: C });
    const [px, py] = proj(E[0], E[1], 0.34);
    blob(ctx, px, py, 4 * s, C);
  }
}
