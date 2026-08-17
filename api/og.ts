import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";
import type { VercelRequest, VercelResponse } from "@vercel/node";
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

export default function handler(req: VercelRequest, res: VercelResponse): void {
  const url = new URL(req.url ?? "/", "http://localhost");
  const name = (url.searchParams.get("u") || "anonymous").trim().slice(0, 64);
  const seed = hashStr(name.toLowerCase());
  const T = buildFace(seed);

  const canvas = createCanvas(W, H);
  const ctx = asDom(canvas.getContext("2d"));
  paper(ctx, W, H, seed);
  drawFace(ctx, W / 2, H * 0.35, W / 1200, T);

  // card text: name + site title only
  ctx.save();
  ctx.fillStyle = "#1f1d1a";
  ctx.textAlign = "center";
  ctx.font = "600 52px ui-monospace, Menlo, monospace";
  ctx.fillText(`@${name}`, W / 2, H * 0.84);
  ctx.globalAlpha = 0.55;
  ctx.font = "24px ui-monospace, Menlo, monospace";
  ctx.fillText("doodles faces", W / 2, H * 0.9);
  ctx.restore();

  const img = canvas.toBuffer("image/png");
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400, immutable");
  res.send(img);
}
