import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";
import { buildFace, caption } from "../src/face";
import { drawFace } from "../src/draw";
import { paper } from "../src/ink";
import { hashStr } from "../src/rng";

// @napi-rs/canvas context is API-compatible with the DOM 2D context we draw with,
// minus a few unused legacy members; the cast bridges the nominal typing.
type Dom2D = CanvasRenderingContext2D;
const asDom = (ctx: SKRSContext2D): Dom2D => ctx as unknown as Dom2D;

export const config = { runtime: "nodejs20.x" };

const W = 1200;
const H = 630;

function renderOG(name: string): Uint8Array {
  const canvas = createCanvas(W, H);
  const ctx = asDom(canvas.getContext("2d"));
  const seed = hashStr(name.toLowerCase());
  paper(ctx, W, H, seed);
  drawFace(ctx, W / 2, H * 0.44, W / 780, buildFace(seed));

  // card text
  ctx.save();
  ctx.fillStyle = "#1f1d1a";
  ctx.textAlign = "center";
  ctx.font = "600 58px ui-monospace, Menlo, monospace";
  ctx.fillText(`@${name}`, W / 2, H * 0.86);
  ctx.globalAlpha = 0.55;
  ctx.font = "26px ui-monospace, Menlo, monospace";
  ctx.fillText(caption(buildFace(seed)), W / 2, H * 0.92);
  ctx.restore();

  return canvas.toBuffer("image/png");
}

export default function handler(req: Request): Response {
  const url = new URL(req.url);
  const name = (url.searchParams.get("u") || "anonymous").trim().slice(0, 64);
  const img = renderOG(name);
  return new Response(new Uint8Array(img) as unknown as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
    },
  });
}
