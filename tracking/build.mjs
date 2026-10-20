// Gera public/_sf/track.js a partir de tracking/track.src.js + tracking/config.json.
// node tracking/build.mjs        → grava
// node tracking/build.mjs --check → falha se o arquivo publicado estiver desatualizado
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const root = new URL("../", import.meta.url);
const cfg = JSON.parse(readFileSync(new URL("tracking/config.json", root), "utf8"));
const strip = (o) => (Array.isArray(o) ? o.map(strip) : o && typeof o === "object"
  ? Object.fromEntries(Object.entries(o).filter(([k]) => k !== "$comment").map(([k, v]) => [k, strip(v)])) : o);
const src = readFileSync(new URL("tracking/track.src.js", root), "utf8");
if (!src.includes("__SF_CONFIG__")) throw new Error("track.src.js sem __SF_CONFIG__");
const out = "/* gerado por tracking/build.mjs — não edite à mão */\n" + src.replace("__SF_CONFIG__", JSON.stringify(strip(cfg)));
const dest = new URL("public/_sf/track.js", root);
if (process.argv.includes("--check")) {
  let cur = ""; try { cur = readFileSync(dest, "utf8"); } catch {}
  if (cur !== out) { console.error("public/_sf/track.js desatualizado: rode node tracking/build.mjs"); process.exit(1); }
  console.log("public/_sf/track.js em dia");
} else {
  mkdirSync(new URL("public/_sf/", root), { recursive: true });
  writeFileSync(dest, out);
  console.log("public/_sf/track.js gerado");
}
