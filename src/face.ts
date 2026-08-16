import { pickW, mulberry32 } from "./rng";
import { ACCENTS, HALOS, HAIRS, SKINS } from "./ink";
import type { Face, Rng } from "./types";

const SKULL: Record<Face["skull"], [number, number]> = {
  egg: [0.92, 1.16],
  round: [1.04, 1.02],
  long: [0.80, 1.30],
  wide: [1.18, 0.94],
  block: [1.06, 1.10],
  pear: [0.86, 1.16],
  gaunt: [0.76, 1.24],
};

export function buildFace(seed: number): Face {
  const rng = mulberry32(seed);
  const skull = pickW(rng, [
    ["egg", 24], ["round", 20], ["long", 16], ["wide", 14], ["block", 10], ["pear", 10], ["gaunt", 6],
  ]);
  const [hrx, hry] = SKULL[skull];
  const plain = rng() < 0.12;
  return {
    seed, skull, hrx, hry,
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

// Mix: a deterministic blend of two faces. Trait-categorical features are
// inherited one side each (so the child visibly resembles both), continuous
// values are averaged, and the seed is derived from both names so the same
// couple always yields the same child.
export function mixFace(a: Face, b: Face): Face {
  const pick = <T,>(x: T, y: T): T => (a.seed < b.seed ? x : y);
  const mid = (x: number, y: number) => (x + y) / 2;
  const l = a.seed < b.seed ? a : b;
  const r = a.seed < b.seed ? b : a;
  const seed = (a.seed ^ (Math.imul(b.seed, 0x9e3779b9) >>> 0)) >>> 0;
  const [hrx, hry] = SKULL[pick(l.skull, r.skull)];
  return {
    seed,
    skull: pick(l.skull, r.skull),
    hrx: mid(a.hrx, b.hrx),
    hry: mid(a.hry, b.hry),
    eyes: pick(l.eyes, r.eyes),
    brow: pick(l.brow, r.brow),
    nose: pick(r.nose, l.nose),
    mouth: pick(r.mouth, l.mouth),
    hair: pick(l.hair, r.hair),
    facial: pick(r.facial, l.facial),
    glasses: pick(l.glasses, r.glasses),
    mod: pick(r.mod, l.mod),
    mark: pick(l.mark, r.mark),
    ink: pick(l.ink, r.ink),
    halo: l.halo ?? r.halo,
    skin: l.skin ?? r.skin,
    yaw: mid(a.yaw, b.yaw),
    pitch: mid(a.pitch, b.pitch),
    asym: mid(a.asym, b.asym),
    ph1: mid(a.ph1, b.ph1),
    ph2: mid(a.ph2, b.ph2),
    ph3: mid(a.ph3, b.ph3),
    a2: mid(a.a2, b.a2),
    a3: mid(a.a3, b.a3),
    tilt: mid(a.tilt, b.tilt),
  };
}

export function mixName(a: string, b: string): string {
  if (!a || !b) return a || b || "anonymous";
  return `${a[0]}${b[0]}${a.length >= 2 ? a[1] : ""}${b.length >= 2 ? b[1] : ""}`.slice(0, 4).toLowerCase();
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
