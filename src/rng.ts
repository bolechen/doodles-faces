import type { Rng, Weighted } from "./types";

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

export function pickW<T extends string>(rng: Rng, table: readonly Weighted<T>[]): T {
  let t = 0;
  for (const [, w] of table) t += w;
  let r = rng() * t;
  for (const [name, w] of table) if ((r -= w) <= 0) return name;
  return table[table.length - 1][0];
}
