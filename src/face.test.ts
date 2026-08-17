import { describe, expect, it } from "vitest";
import { hashStr, mulberry32 } from "./rng";
import { buildFace as srcFace, caption as srcCaption, mixFace } from "./face";
import { buildFace as libFace, caption as libCaption } from "../api/_lib/dna";

const NAMES = ["ada", "yuki", "neo", "anonymous", "bob", "kai", "mannay", "x"];

describe("determinism (same name, same face)", () => {
  it("hashStr is deterministic", () => {
    for (const n of NAMES) {
      expect(hashStr(n.toLowerCase())).toBe(hashStr(n.toLowerCase()));
    }
  });

  it("mulberry32 reproduces the same sequence", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect(Array.from({ length: 20 }, () => a())).toEqual(
      Array.from({ length: 20 }, () => b()),
    );
  });

  it("same seed produces the same face (src)", () => {
    for (const n of NAMES) {
      const s = hashStr(n.toLowerCase());
      expect(srcFace(s)).toEqual(srcFace(s));
    }
  });

  it("mix is deterministic for the same couple", () => {
    const a = hashStr("ada".toLowerCase());
    const b = hashStr("bob".toLowerCase());
    expect(mixFace(srcFace(a), srcFace(b))).toEqual(mixFace(srcFace(a), srcFace(b)));
  });
});

describe("src and api/_lib stay in sync (page face === OG card face)", () => {
  it("identical traits and captions", () => {
    for (const n of NAMES) {
      const s = hashStr(n.toLowerCase());
      expect(srcCaption(srcFace(s))).toBe(libCaption(libFace(s)));
      expect(srcFace(s).skull).toBe(libFace(s).skull);
      expect(srcFace(s).eyes).toBe(libFace(s).eyes);
      expect(srcFace(s).hair).toBe(libFace(s).hair);
      expect(srcFace(s).yaw).toBe(libFace(s).yaw);
    }
  });
});
