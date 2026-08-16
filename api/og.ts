import { createElement as h, type CSSProperties } from "react";
import { ImageResponse } from "@vercel/og";
import { buildFace, caption, hashStr } from "./_lib/dna";

export const config = { runtime: "edge" };

const INK = "#1f1d1a";
const PAPER = "#f3eee2";

// ---- hand-drawn face as SVG primitives (Satori supports inline svg) ----
function faceSVG(seed: number, size: number) {
  const T = buildFace(seed);
  const cx = 100, cy = 108, s = size / 200;
  const rx = 58 * T.hrx * s, ry = 66 * T.hry * s;
  const yaw = T.yaw;
  const ox = yaw * rx * 0.25;
  const ink = T.ink;

  const head = `M ${cx + ox} ${cy - ry} C ${cx + ox + rx * 0.9} ${cy - ry * 1.15}, ${cx + ox + rx} ${cy}, ${cx + ox + rx * 0.9} ${cy + ry * 0.75} C ${cx + ox + rx * 0.5} ${cy + ry * 1.1}, ${cx + ox - rx * 0.5} ${cy + ry * 1.1}, ${cx + ox - rx * 0.9} ${cy + ry * 0.75} C ${cx + ox - rx} ${cy}, ${cx + ox - rx * 0.9} ${cy - ry * 1.15}, ${cx + ox} ${cy - ry} Z`;

  // eyes
  const eyeY = cy - 14 * s;
  const gap = 34 * s * (1 - Math.abs(yaw) * 0.25);
  const eyes = [-1, 1].filter((sd) => sd * yaw > -0.4).map((sd) => {
    const ex = cx + ox + sd * gap;
    const style: CSSProperties = {
      fill: ink,
      transform: `translate(${ex}px, ${eyeY}px)`,
    };
    return h("circle", { key: `e${sd}`, r: 4.2 * s, ...style });
  });

  // brows
  const browY = eyeY - 16 * s;
  const brows = T.brow === "none" ? [] : [-1, 1].filter((sd) => sd * yaw > -0.4).map((sd) => {
    const bx = cx + ox + sd * gap;
    return h("line", {
      key: `b${sd}`,
      x1: bx - 12 * s, y1: browY,
      x2: bx + 12 * s, y2: browY - 2 * s,
      stroke: ink, strokeWidth: 3.2 * s, strokeLinecap: "round",
    });
  });

  // nose
  const nose = h("path", {
    d: `M ${cx + ox * 1.3} ${cy - 2 * s} Q ${cx + ox * 1.2} ${cy + 16 * s} ${cx + ox * 1.3 + yaw * 8 * s} ${cy + 22 * s}`,
    stroke: ink, strokeWidth: 3 * s, fill: "none", strokeLinecap: "round",
  });

  // mouth
  const my = cy + 38 * s;
  const mouth =
    T.mouth === "smile"
      ? h("path", {
          d: `M ${cx + ox - 18 * s} ${my} Q ${cx + ox} ${my + 12 * s} ${cx + ox + 18 * s} ${my}`,
          stroke: ink, strokeWidth: 3 * s, fill: "none", strokeLinecap: "round",
        })
      : T.mouth === "frown"
        ? h("path", {
            d: `M ${cx + ox - 16 * s} ${my + 8 * s} Q ${cx + ox} ${my - 2 * s} ${cx + ox + 16 * s} ${my + 8 * s}`,
            stroke: ink, strokeWidth: 3 * s, fill: "none", strokeLinecap: "round",
          })
        : T.mouth === "open"
          ? h("ellipse", { cx: cx + ox, cy: my + 3 * s, rx: 12 * s, ry: 9 * s, fill: "#5a3230", stroke: ink, strokeWidth: 2.6 * s })
          : h("line", { x1: cx + ox - 18 * s, y1: my, x2: cx + ox + 18 * s, y2: my - 1 * s, stroke: ink, strokeWidth: 3 * s, strokeLinecap: "round" });

  // hair cap (behind + top)
  const hair = T.hair === "none" || T.hair === "baldspot" ? null : h("path", {
    d: `M ${cx - rx * 1.08} ${cy - ry * 0.4} C ${cx - rx * 1.15} ${cy - ry * 1.5}, ${cx + rx * 1.15} ${cy - ry * 1.5}, ${cx + rx * 1.08} ${cy - ry * 0.4} C ${cx + rx * 1.02} ${cy - ry * 1.15}, ${cx} ${cy - ry * 1.3}, ${cx - rx} ${cy - ry * 1.15} Z`,
    fill: T.hair === "bowl" || T.hair === "buzz" || T.hair === "spikes" || T.hair === "curl" || T.hair === "side" || T.hair === "hat" ? INK : "none",
    stroke: INK, strokeWidth: 2.4 * s, strokeLinecap: "round",
  });

  // glasses
  const glasses =
    T.glasses === "none"
      ? []
      : h("g", null, [
          h("circle", { key: "gl", cx: cx + ox - gap, cy: eyeY, r: 14 * s, fill: "none", stroke: ink, strokeWidth: 2.4 * s }),
          h("circle", { key: "gr", cx: cx + ox + gap, cy: eyeY, r: 14 * s, fill: "none", stroke: ink, strokeWidth: 2.4 * s }),
          h("line", { key: "gb", x1: cx + ox - gap + 14 * s, y1: eyeY, x2: cx + ox + gap - 14 * s, y2: eyeY, stroke: ink, strokeWidth: 2 * s }),
        ]);

  // halo wash behind head
  const halo = T.halo
    ? h("ellipse", { cx: cx + ox, cy: cy - 6 * s, rx: rx * 1.3, ry: ry * 1.25, fill: T.halo, opacity: 0.55 })
    : null;

  return h("svg", { width: size, height: size, viewBox: "0 0 200 200" }, [
    halo,
    hair,
    h("path", { key: "head", d: head, fill: "none", stroke: ink, strokeWidth: 3.4 * s, strokeLinecap: "round" }),
    ...brows,
    ...eyes,
    nose,
    mouth,
    glasses,
  ]);
}

export default function handler(req: Request): Response {
  const url = new URL(req.url, "http://localhost");
  const name = (url.searchParams.get("u") || "anonymous").trim().slice(0, 64);
  const seed = hashStr(name.toLowerCase());
  const T = buildFace(seed);
  const line = caption(T);

  const card = h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: PAPER,
        position: "relative",
      },
    },
    [
      h("div", { key: "face", style: { display: "flex", justifyContent: "center" } }, faceSVG(seed, 380)),
      h("div", {
        key: "name",
        style: {
          marginTop: 24,
          color: INK,
          fontSize: 56,
          fontWeight: 700,
          fontFamily: "monospace",
          letterSpacing: -2,
        },
      }, `@${name}`),
      h("div", {
        key: "line",
        style: { marginTop: 10, color: "#6a6358", fontSize: 26, fontFamily: "monospace" },
      }, line),
    ],
  );

  return new ImageResponse(card, {
    width: 1200,
    height: 630,
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable" },
  });
}
