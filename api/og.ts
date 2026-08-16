import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";
import { buildFace, caption, hashStr } from "./_lib/dna.js";
import { drawFace } from "./_lib/draw.js";
import { paper } from "./_lib/ink.js";

export const config = { runtime: "nodejs" };

// @napi-rs/canvas context is API-compatible with the DOM 2D context we draw
// with, minus a few unused legacy members; the cast bridges the nominal typing.
type Dom2D = CanvasRenderingContext2D;
const asDom = (ctx: SKRSContext2D): Dom2D => ctx as unknown as Dom2D;

const W = 1200;
const H = 630;

export default function handler(req: Request): Response {
  // req.url may be relative in dev; resolve against a dummy origin.
  const url = new URL(req.url, "http://localhost");
  const name = (url.searchParams.get("u") || "anonymous").trim().slice(0, 64);
  const seed = hashStr(name.toLowerCase());
  const T = buildFace(seed);

  const canvas = createCanvas(W, H);
  const ctx = asDom(canvas.getContext("2d"));
  paper(ctx, W, H, seed);
  drawFace(ctx, W / 2, H * 0.44, W / 780, T);

  // card text
  ctx.save();
  ctx.fillStyle = "#1f1d1a";
  ctx.textAlign = "center";
  ctx.font = "600 58px ui-monospace, Menlo, monospace";
  ctx.fillText(`@${name}`, W / 2, H * 0.86);
  ctx.globalAlpha = 0.55;
  ctx.font = "26px ui-monospace, Menlo, monospace";
  ctx.fillText(caption(T), W / 2, H * 0.92);
  ctx.restore();

  const img = canvas.toBuffer("image/png");
  return new Response(new Uint8Array(img) as unknown as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
    },
  });
}
