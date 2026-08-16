import { hashStr } from "./rng";
import { renderAvatar } from "./draw";
import "./style.css";

const canvas = document.querySelector<HTMLCanvasElement>("#c")!;
const ctx = canvas.getContext("2d")!;
const userInput = document.querySelector<HTMLInputElement>("#user")!;
const whoEl = document.querySelector("#who")!;
const seedEl = document.querySelector("#seedLabel")!;
const toastEl = document.querySelector("#toast")!;

const NAMES = [
  "ada", "bob", "chi", "dev", "eva", "fox", "gio", "hex", "ivy", "jay",
  "kai", "leo", "mia", "neo", "omi", "pix", "qin", "rio", "sol", "tea",
  "uma", "val", "wen", "xo", "yuki", "zed", "mannay", "ink", "doodle",
];

let current = { name: "", seed: 0 };
let toastTimer = 0;
let debounceTimer = 0;
let raf = 0;
const DEBOUNCE_MS = 180;

function toast(msg: string): void {
  toastEl.textContent = msg;
  toastEl.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove("on"), 1400);
}

function normalizeName(raw: string | null | undefined): string {
  return String(raw ?? "").trim().slice(0, 64);
}

function shareUrl(name: string): string {
  const u = new URL(location.href);
  u.search = "";
  u.hash = "";
  if (name) u.searchParams.set("u", name);
  return u.toString();
}

function setUrl(name: string, replace = true): void {
  history[replace ? "replaceState" : "pushState"](null, "", shareUrl(name));
}

function render(name: string): void {
  const n = normalizeName(name) || "anonymous";
  const seed = hashStr(n.toLowerCase());
  current = { name: n, seed };
  renderAvatar(ctx, seed);
  whoEl.textContent = n;
  seedEl.textContent = String(seed);
  document.title = `${n} · doodles-faces`;
}

function scheduleRender(name: string, syncUrl = true): void {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    render(name);
    if (syncUrl) setUrl(normalizeName(name));
  });
}

function downloadPng(): void {
  const name = current.name || "anonymous";
  const a = document.createElement("a");
  a.download = `doodle-${name}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
}

async function share(): Promise<void> {
  const name = current.name || "anonymous";
  const url = shareUrl(name);
  const title = `${name}'s doodle face`;
  try {
    if (navigator.share) {
      let file: File | undefined;
      try {
        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
        if (blob) file = new File([blob], `doodle-${name}.png`, { type: "image/png" });
      } catch { /* ignore */ }
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

function randomName(): void {
  const base = NAMES[Math.floor(Math.random() * NAMES.length)];
  const n = Math.random() < 0.45 ? base : `${base}${Math.floor(Math.random() * 90 + 10)}`;
  userInput.value = n;
  scheduleRender(n);
  userInput.focus();
  userInput.select();
}

const params = new URLSearchParams(location.search);
const initial = normalizeName(params.get("u") || params.get("user"));
userInput.value = initial;
scheduleRender(initial || "anonymous", Boolean(initial));

userInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => scheduleRender(userInput.value), DEBOUNCE_MS);
});
userInput.addEventListener("change", () => scheduleRender(userInput.value));
userInput.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  clearTimeout(debounceTimer);
  scheduleRender(userInput.value);
  userInput.blur();
});
document.querySelector("#rand")!.addEventListener("click", randomName);
document.querySelector("#png")!.addEventListener("click", downloadPng);
document.querySelector("#share")!.addEventListener("click", () => { void share(); });
window.addEventListener("popstate", () => {
  const u = normalizeName(new URLSearchParams(location.search).get("u"));
  if (u === normalizeName(userInput.value)) return;
  userInput.value = u;
  scheduleRender(u || "anonymous", false);
});
