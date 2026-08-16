import { pickW, mulberry32 } from "./rng";
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
  return {
    seed, skull, hrx, hry,
    eyes: pickW(rng, [["bags", 18], ["dead", 18], ["round", 16], ["side", 14], ["hollow", 12], ["wide", 12], ["squint", 10]]),
    brow: pickW(rng, [["none", 22], ["flat", 22], ["tired", 18], ["worry", 18], ["raise", 12], ["uni", 8]]),
    nose: pickW(rng, [["hook", 20], ["long", 16], ["line", 14], ["button", 14], ["wide", 12], ["bulb", 12], ["beak", 12]]),
    mouth: pickW(rng, [["flat", 20], ["smile", 16], ["smirk", 16], ["grim", 14], ["frown", 12], ["open", 12], ["line", 10]]),
    hair: pickW(rng, [["bowl", 18], ["buzz", 14], ["spikes", 12], ["curl", 12], ["side", 12], ["none", 12], ["hat", 10], ["baldspot", 10]]),
    facial: pickW(rng, [["none", 52], ["stubble", 16], ["mustache", 16], ["goatee", 16]]),
    glasses: pickW(rng, [["none", 58], ["round", 16], ["square", 14], ["shades", 12]]),
    ink: pickW(rng, [["#241f1a", 52], ["#4a3423", 16], ["#2f3b45", 12], ["#6f3327", 10], ["#374436", 10]]),
    yaw: (rng() * 2 - 1) * 0.72,
    pitch: (rng() * 2 - 1) * 0.16,
    asym: (rng() * 2 - 1) * 0.06,
    ph1: rng() * 6.28, ph2: rng() * 6.28, ph3: rng() * 6.28,
    a2: 0.06 + rng() * 0.08, a3: 0.03 + rng() * 0.06,
    tilt: (rng() * 2 - 1) * 0.06,
  };
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
