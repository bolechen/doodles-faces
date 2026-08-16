import { hashStr } from "./rng";
import { buildFace, caption } from "./face";
import { drawFace, renderAvatar, renderCrowd, renderShareCard } from "./draw";
import "./style.css";

const canvas = document.querySelector<HTMLCanvasElement>("#c")!;
const ctx = canvas.getContext("2d")!;
const stage = document.querySelector<HTMLElement>("#stage")!;
const userInput = document.querySelector<HTMLInputElement>("#seed-name")!;
const withInput = document.querySelector<HTMLInputElement>("#with")!;
const whoEl = document.querySelector("#who")!;
const seedEl = document.querySelector("#seedLabel")!;
const captionEl = document.querySelector("#caption")!;
const toastEl = document.querySelector("#toast")!;
const hintEl = document.querySelector("#hint")!;
const soloBtn = document.querySelector<HTMLButtonElement>("#solo")!;
const crowdBtn = document.querySelector<HTMLButtonElement>("#crowd")!;

const NAMES = ["ada", "rio", "yuki", "hex", "sol", "neo", "pix", "kai", "zed", "omi", "tea", "wen"];
const SITE = "https://doodles-faces.vercel.app";

let current = { name: "anonymous", withName: "", seed: 0 };
let mode: "solo" | "crowd" = "solo";
let crowdSeeds: number[] = [];
let toastTimer = 0;
let debounceTimer = 0;
let raf = 0;

function toast(msg: string): void {
  toastEl.textContent = msg;
  toastEl.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove("on"), 1400);
}

function normalizeName(raw: string | null | undefined): string {
  return String(raw ?? "").trim().slice(0, 64);
}

function shareUrl(name: string, withName = "", view = mode): string {
  const u = new URL(location.origin === "null" ? SITE : location.href);
  u.search = "";
  u.hash = "";
  if (name) u.searchParams.set("u", name);
  if (withName) u.searchParams.set("with", withName);
  if (view === "crowd") u.searchParams.set("view", "crowd");
  return u.toString();
}

function setUrl(name: string, withName: string, replace = true): void {
  history[replace ? "replaceState" : "pushState"](null, "", shareUrl(name, withName));
}

function sizeCanvas(crowd: boolean): void {
  canvas.width = crowd ? 1280 : 900;
  canvas.height = crowd ? 800 : 900;
  stage.classList.toggle("crowd", crowd);
}

function render(): void {
  const name = current.name;
  const seed = hashStr(name.toLowerCase());
  current.seed = seed;
  const face = buildFace(seed);
  whoEl.textContent = name;
  seedEl.textContent = String(seed);
  captionEl.textContent = caption(face);
  document.title = `${name} · doodles faces`;

  const metaTitle = document.querySelector('meta[property="og:title"]');
  const metaDesc = document.querySelector('meta[property="og:description"]');
  if (metaTitle) metaTitle.setAttribute("content", `${name}'s doodle face`);
  if (metaDesc) metaDesc.setAttribute("content", caption(face));

  if (mode === "crowd") {
    sizeCanvas(true);
    crowdSeeds = renderCrowd(ctx, seed, 5, 3);
    hintEl.textContent = "click a face to reroll it";
    return;
  }
  sizeCanvas(false);
  if (current.withName) {
    paperSplit(seed, hashStr(current.withName.toLowerCase()));
    hintEl.textContent = `${name} × ${current.withName}`;
  } else {
    renderAvatar(ctx, seed);
    hintEl.textContent = "same name, same face";
  }
}

function paperSplit(a: number, b: number): void {
  const { width: w, height: h } = canvas;
  ctx.clearRect(0, 0, w, h);
  const left = document.createElement("canvas");
  const right = document.createElement("canvas");
  left.width = right.width = w / 2;
  left.height = right.height = h;
  renderAvatar(left.getContext("2d")!, a);
  renderAvatar(right.getContext("2d")!, b);
  ctx.drawImage(left, 0, 0);
  ctx.drawImage(right, w / 2, 0);
}

function schedule(syncUrl = true): void {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    current.name = normalizeName(userInput.value) || "anonymous";
    current.withName = normalizeName(withInput.value);
    render();
    if (syncUrl) setUrl(current.name === "anonymous" ? "" : current.name, current.withName);
  });
}

function cardCanvas(): HTMLCanvasElement {
  const card = document.createElement("canvas");
  card.width = 1200;
  card.height = 630;
  renderShareCard(card.getContext("2d")!, current.seed, current.name, caption(buildFace(current.seed)));
  return card;
}

function downloadPng(): void {
  const src = mode === "solo" && !current.withName ? cardCanvas() : canvas;
  const a = document.createElement("a");
  a.download = `doodle-${current.name}.png`;
  a.href = src.toDataURL("image/png");
  a.click();
}

async function share(): Promise<void> {
  const url = shareUrl(current.name, current.withName);
  const title = `${current.name}'s doodle face`;
  try {
    if (navigator.share) {
      const blob = await new Promise<Blob | null>((res) => cardCanvas().toBlob(res, "image/png"));
      const file = blob ? new File([blob], `doodle-${current.name}.png`, { type: "image/png" }) : undefined;
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, text: title, url, files: [file] });
      } else {
        await navigator.share({ title, text: title, url });
      }
      return;
    }
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toast("link copied");
  } catch {
    prompt("copy link", url);
  }
}

function setMode(next: "solo" | "crowd"): void {
  mode = next;
  soloBtn.setAttribute("aria-pressed", String(next === "solo"));
  crowdBtn.setAttribute("aria-pressed", String(next === "crowd"));
  schedule();
}

function randomName(): void {
  const n = NAMES[Math.floor(Math.random() * NAMES.length)] + (Math.random() < 0.4 ? String(10 + Math.floor(Math.random() * 89)) : "");
  userInput.value = n;
  schedule();
  userInput.focus();
  userInput.select();
}

const params = new URLSearchParams(location.search);
userInput.value = normalizeName(params.get("u") || params.get("user"));
withInput.value = normalizeName(params.get("with"));
if (params.get("view") === "crowd") mode = "crowd";
soloBtn.setAttribute("aria-pressed", String(mode === "solo"));
crowdBtn.setAttribute("aria-pressed", String(mode === "crowd"));
schedule(Boolean(userInput.value || withInput.value || mode === "crowd"));

const onType = () => {
  clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => schedule(), 180);
};
userInput.addEventListener("input", onType);
withInput.addEventListener("input", onType);
userInput.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  clearTimeout(debounceTimer);
  schedule();
});
document.querySelector("#rand")!.addEventListener("click", randomName);
document.querySelector("#png")!.addEventListener("click", downloadPng);
document.querySelector("#share")!.addEventListener("click", () => { void share(); });
soloBtn.addEventListener("click", () => setMode("solo"));
crowdBtn.addEventListener("click", () => setMode("crowd"));
canvas.addEventListener("click", (e) => {
  if (mode !== "crowd" || crowdSeeds.length === 0) return;
  const r = canvas.getBoundingClientRect();
  const gx = ((e.clientX - r.left) / r.width) * 5;
  const gy = ((e.clientY - r.top) / r.height) * 3;
  const i = Math.min(4, gx | 0) + Math.min(2, gy | 0) * 5;
  crowdSeeds[i] = (Math.random() * 0x7fffffff) | 0;
  const { width: w, height: h } = canvas;
  const cw = w / 5, ch = h / 3;
  const x = (i % 5) * cw, y = Math.floor(i / 5) * ch;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, cw, ch);
  ctx.clip();
  ctx.fillStyle = "#f3eee2";
  ctx.fillRect(x, y, cw, ch);
  drawFace(ctx, x + cw / 2, y + ch / 2, Math.min(cw, ch) / 280, buildFace(crowdSeeds[i]));
  ctx.restore();
});
window.addEventListener("popstate", () => {
  const q = new URLSearchParams(location.search);
  userInput.value = normalizeName(q.get("u"));
  withInput.value = normalizeName(q.get("with"));
  mode = q.get("view") === "crowd" ? "crowd" : "solo";
  schedule(false);
});
