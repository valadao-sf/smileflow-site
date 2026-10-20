// Roda public/_sf/track.js num window falso, com espiões no lugar de cada plataforma.
import { readFileSync } from "node:fs";
import vm from "node:vm";
export function load({ pre, url = "https://smileflow.com.br/simulador-objecoes/ta-caro", referrer = "", config, storage = {}, cookies = "" } = {}) {
  let code = readFileSync(new URL("../public/_sf/track.js", import.meta.url), "utf8");
  if (config) code = code.replace(/var CFG = (\{.*?\});\n/s, (_, j) => `var CFG = ${JSON.stringify(config(JSON.parse(j)))};\n`);
  const u = new URL(url);
  const mk = (seed) => { const m = new Map(Object.entries(seed)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), _m: m }; };
  const calls = { gtag: [], fbq: [], ttq: [], uetq: [], lintrk: [], pintrk: [], kwaiq: [], scripts: [] };
  const head = { appendChild: (s) => calls.scripts.push(s.src) };
  const document = {
    referrer, cookie: cookies, head, documentElement: head,
    createElement: () => ({ setAttribute() {}, set src(v) { this._src = v; }, get src() { return this._src; } }),
    getElementsByTagName: () => [],
  };
  const window = {
    location: { hostname: u.hostname, pathname: u.pathname, search: u.search, origin: u.origin },
    navigator: { userAgent: "Teste/1.0" }, crypto: { randomUUID: () => "id-" + Math.random().toString(36).slice(2, 10) },
    localStorage: mk(storage.local || {}), sessionStorage: mk(storage.session || {}), dataLayer: [],
    URL, URLSearchParams, Date, JSON, Math, Object, Array, String, Number, RegExp,
  };
  // espiões: os loaders definem fbq/ttq etc.; trocamos depois do boot pelas versões que gravam
  if (pre) pre(window);
  vm.runInNewContext(code, { window, document, URL, URLSearchParams, console }, { filename: "track.js" });
  const w = window;
  const clone = (a) => JSON.parse(JSON.stringify(a));
  const spy = (name) => (...a) => calls[name].push(clone(a));
  if (w.fbq) w.fbq = spy("fbq");
  if (w.ttq) w.ttq = { track: spy("ttq"), page() {}, grantConsent() {}, revokeConsent() {} };
  if (w.uetq) w.uetq = { push: spy("uetq") };
  if (w.lintrk) w.lintrk = spy("lintrk");
  if (w.pintrk) w.pintrk = spy("pintrk");
  if (w.kwaiq) w.kwaiq = { instance: () => ({ track: spy("kwaiq") }) };
  return { w, calls, gtagCalls: () => w.dataLayer.filter((x) => x && typeof x === "object" && "0" in x).map((x) => clone(Array.from(x))) };
}
