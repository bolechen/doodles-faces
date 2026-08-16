// Self-contained face DNA for the serverless OG endpoint.
// Mirrors src/face.ts + the palette constants from src/ink.ts, but depends on
// nothing (no canvas, no DOM) so Vercel can bundle it without file tracing.

import type { Face } from "./types";

export type Rng = () => number;

export function mulberry32(a: number): Rng {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickW<T extends string>(rng: Rng, table: readonly (readonly [T, number])[]): T {
  let t = 0;
  for (const [, w] of table) t += w;
  let r = rng() * t;
  for (const [name, w] of table) if ((r -= w) <= 0) return name;
  return table[table.length - 1][0];
}

const SKULL: Record<string, [number, number]> = {
  egg: [0.92, 1.16],
  round: [1.04, 1.02],
  long: [0.8, 1.3],
  wide: [1.18, 0.94],
  block: [1.06, 1.1],
  pear: [0.86, 1.16],
  gaunt: [0.76, 1.24],
};

const HALOS = ["#a8b0a0", "#b7bcc9", "#c3bfc8", "#b8b2a6", "#b3c2cc", "#cbb4b0", "#d8d2bf"];
const SKINS = ["#8a5d42", "#a4714f", "#c08a5c", "#e3c9a0", "#d9a98f", "#9c8878", "#ddc687"];
const HAIRS = ["#aa6030", "#b49648", "#5c8478", "#5c688c", "#8c6058"];
const ACCENTS = ["#a8483c", "#568278", "#b2863a"];



export function buildFace(seed: number): Face {
  const rng = mulberry32(seed);
  const skull = pickW(rng, [
    ["egg", 24], ["round", 20], ["long", 16], ["wide", 14], ["block", 10], ["pear", 10], ["gaunt", 6],
  ]);
  const [hrx, hry] = SKULL[skull];
  const plain = rng() < 0.12;
  return {
    seed,
    skull, hrx, hry,
    eyes: pickW(rng, [["bags", 18], ["dead", 18], ["round", 16], ["side", 14], ["hollow", 12], ["wide", 12], ["squint", 10]]),
    brow: pickW(rng, [["none", 22], ["flat", 22], ["tired", 18], ["worry", 18], ["raise", 12], ["uni", 8]]),
    nose: pickW(rng, [["hook", 20], ["long", 16], ["line", 14], ["button", 14], ["wide", 12], ["bulb", 12], ["beak", 12]]),
    mouth: pickW(rng, [["flat", 20], ["smile", 16], ["smirk", 16], ["grim", 14], ["frown", 12], ["open", 12], ["line", 10]]),
    hair: pickW(rng, [["bowl", 18], ["buzz", 14], ["spikes", 12], ["curl", 12], ["side", 12], ["none", 12], ["hat", 10], ["baldspot", 10]]),
    facial: pickW(rng, [["none", 52], ["stubble", 16], ["mustache", 16], ["goatee", 16]]),
    glasses: pickW(rng, [["none", 58], ["round", 16], ["square", 14], ["shades", 12]]),
    mod: pickW(rng, [["none", 62], ["visor", 14], ["patch", 12], ["cyber", 12]]),
    mark: pickW(rng, [["none", 64], ["scar", 14], ["seam", 12], ["barcode", 10]]),
    ink: rng() < 0.22 ? HAIRS[(rng() * HAIRS.length) | 0] : "#1f1d1a",
    halo: !plain && rng() < 0.72 ? HALOS[(rng() * HALOS.length) | 0] : (rng() < 0.2 ? ACCENTS[(rng() * ACCENTS.length) | 0] : null),
    skin: !plain && rng() < 0.55 ? SKINS[(rng() * SKINS.length) | 0] : null,
    yaw: (rng() * 2 - 1) * 0.72,
    pitch: (rng() * 2 - 1) * 0.16,
    asym: (rng() * 2 - 1) * 0.06,
    ph1: rng() * 6.28, ph2: rng() * 6.28, ph3: rng() * 6.28,
    a2: 0.06 + rng() * 0.08, a3: 0.03 + rng() * 0.06,
    tilt: (rng() * 2 - 1) * 0.06,
  };
}

export function caption(T: Face): string {
  const bits: string[] = [T.skull, T.eyes, T.hair];
  if (T.glasses !== "none") bits.push(T.glasses);
  if (T.mod !== "none") bits.push(T.mod);
  if (T.mark !== "none") bits.push(T.mark);
  if (T.facial !== "none") bits.push(T.facial);
  return bits.join(" · ");
}

export function headPath(T: Face, rng: Rng): [number, number, number][] {
  const n = 28, pts: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rw = 1 + T.a2 * Math.sin(a * 2 + T.ph1) + T.a3 * Math.sin(a * 3 + T.ph2) + (rng() * 2 - 1) * 0.028;
    const rh = 1 + T.a3 * Math.cos(a * 2 + T.ph3);
    pts.push([
      Math.cos(a) * T.hrx * rw + T.tilt * Math.sin(a),
      Math.sin(a) * T.hry * rh,
      0,
    ]);
  }
  return pts;
}
