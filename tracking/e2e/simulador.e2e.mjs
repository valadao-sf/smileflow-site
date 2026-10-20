// Prova no navegador: o simulador servido como smileflow.com.br, com todas as plataformas ligadas (IDs de teste)
// e os scripts delas trocados por filas. Confere: um disparo por evento, mesmo event_id no pixel e no n8n,
// não-saúde nunca vira conversão padrão, ?teste=1 sem anúncio e GA4 em debug_mode.
// Uso: npx next start -p 3077 & ; PW=<caminho do playwright-core> node tracking/e2e/simulador.e2e.mjs
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || "playwright-core");
const ORIGIN = process.env.SITE || "http://localhost:3077";
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TEST_IDS = { googleAds: { id: "AW-1", labels: { diagnostico_concluido: "LD", guia_liberado: "LG", pedido_contato: "LC", clique_whatsapp: "LW" } },
  tiktok: { pixelId: "TT1" }, microsoftUet: { tagId: "UET1" }, clarity: { projectId: "CL1" } };
const trackJs = readFileSync(new URL("../../public/_sf/track.js", import.meta.url), "utf8")
  .replace(/var CFG = (\{.*?\});\n/s, (_, j) => `var CFG = ${JSON.stringify({ ...JSON.parse(j), ...TEST_IDS })};\n`);

async function session(b, { query = "", area = "saude_estetica", what = "Clínica odontológica" }) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const posts = [];
  await ctx.route("https://smileflow.com.br/**", async (r) => {
    const u = new URL(r.request().url());
    if (u.pathname === "/_sf/track.js") return r.fulfill({ body: trackJs, contentType: "text/javascript" });
    const res = await fetch(ORIGIN + u.pathname + (u.pathname.startsWith("/simulador-objecoes/") && !/\.\w+$/.test(u.pathname) ? ".html" : "") + u.search);
    r.fulfill({ status: res.status, body: Buffer.from(await res.arrayBuffer()), headers: { "content-type": res.headers.get("content-type") || "text/html" } });
  });
  await ctx.route(/n8n\.smileflow\.me/, (r) => { if (r.request().method() === "POST") posts.push(JSON.parse(r.request().postData())); r.fulfill({ status: 200, headers: { "access-control-allow-origin": "https://smileflow.com.br" }, body: "" }); });
  // bat.js falso: a UET de verdade troca a fila por um objeto com push; este grava em window.__uet
  await ctx.route(/bat\.bing\.com/, (r) => r.fulfill({ contentType: "text/javascript", body: "window.__uet=[];window.UET=function(o){(o.q||[]).forEach(function(a){window.__uet.push(a)});this.push=function(){window.__uet.push([].slice.call(arguments))}};" }));
  await ctx.route(/googletagmanager|connect\.facebook|analytics\.tiktok|clarity\.ms|pandavideo|jsdelivr/, (r) => r.fulfill({ body: "", contentType: "text/javascript" }));
  const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
  await pg.goto("https://smileflow.com.br/simulador-objecoes/ta-caro" + query); await pg.waitForTimeout(1200);
  // perfil, pela interface
  await pg.locator("[data-sim]:visible").first().click(); await pg.waitForTimeout(900);
  await pg.fill("#in-name", "Teste Simulador"); await pg.click("#n-go"); await pg.waitForTimeout(700);
  await pg.click(`[data-biz="${area}"]`); await pg.waitForTimeout(800);
  const profile = async () => {
    for (let i = 0; i < 5 && (await pg.evaluate("S.scene")) === "name"; i++) {
      if (await pg.$("#in-other")) { await pg.fill("#in-other", what); await pg.click("#n-go"); }
      else await pg.locator("#s-name .choice").first().click();
      await pg.waitForTimeout(800);
    }
  };
  await profile();
  // simulação até o pedido do guia
  for (let i = 0; i < 80 && !(await pg.$("#lead-form")); i++) {
    await pg.evaluate((sc) => { const root = document.querySelector("#s-" + sc); const vis = (e) => e.offsetParent && !e.disabled;
      const p = [...root.querySelectorAll(".opt, .choice, .dopt")].find(vis) || [...root.querySelectorAll(".btn-main, .btn-wine, .btn")].find(vis); p && p.click(); }, await pg.evaluate("S.scene"));
    await pg.waitForTimeout(700);
  }
  await pg.fill("#ld-name", "Teste Simulador"); await pg.fill("#ld-phone", "27999990000"); await pg.check("#ld-ok"); await pg.click("#ld-send");
  await pg.waitForTimeout(2500);
  // diagnóstico inteiro
  await pg.evaluate("startDiag('e2e')"); await pg.waitForTimeout(900); await profile();
  for (let i = 0; i < 7; i++) { await pg.locator("#s-diag [data-opt]").first().click(); await pg.waitForTimeout(500); }
  await pg.waitForTimeout(1500);
  const q = await pg.evaluate(() => ({
    fbq: (window.fbq && window.fbq.queue || []).map((a) => Array.from(a)), ttq: (window.ttq || []).filter(Array.isArray),
    uetq: window.__uet || [],
    gtag: window.dataLayer.filter((x) => x && typeof x === "object" && "0" in x).map((x) => Array.from(x)),
    vendors: Object.keys(window.sfTrack.vendors), test: window.sfTrack.isTest,
  }));
  await ctx.close();
  return { q: JSON.parse(JSON.stringify(q)), posts, errs };
}

const b = await chromium.launch({ executablePath: CHROME, headless: true });
const ok = [];
const check = (name, fn) => { fn(); ok.push(name); };

const s = await session(b, {});
const guia = s.posts.find((p) => p.type === "guia"), diag = s.posts.find((p) => p.type === "diagnostico");
check("sem erro de página", () => assert.deepEqual(s.errs, []));
check("todas as plataformas de teste carregaram", () => assert.deepEqual(s.q.vendors.sort(), ["clarity", "ga4", "googleAds", "meta", "microsoftUet", "tiktok"]));
check("guia: Meta CompleteRegistration uma vez, com o event_id do n8n", () => {
  const ev = s.q.fbq.filter((a) => a[0] === "track" && a[1] === "CompleteRegistration");
  assert.equal(ev.length, 1); assert.equal(ev[0][3].eventID, guia.event_id);
});
check("diagnóstico com WhatsApp: Lead (Meta), SubmitForm (TikTok), generate_lead (GA4), conversão do Google Ads — uma vez cada, mesmo event_id", () => {
  const lead = s.q.fbq.filter((a) => a[0] === "track" && a[1] === "Lead"); assert.equal(lead.length, 1); assert.equal(lead[0][3].eventID, diag.event_id);
  const tt = s.q.ttq.filter((a) => a[0] === "track" && a[1] === "SubmitForm"); assert.equal(tt.length, 1); assert.equal(tt[0][3].event_id, diag.event_id);
  const ga = s.q.gtag.filter((a) => a[0] === "event" && a[1] === "generate_lead"); assert.equal(ga.length, 1); assert.equal(ga[0][2].event_id, diag.event_id);
  const ads = s.q.gtag.filter((a) => a[0] === "event" && a[1] === "conversion" && a[2].send_to === "AW-1/LD"); assert.equal(ads.length, 1); assert.equal(ads[0][2].transaction_id, diag.event_id);
});
check("Microsoft UET: submit_lead_form uma vez", () => assert.equal(s.q.uetq.filter((a) => a[0] === "event" && a[1] === "submit_lead_form").length, 1));
check("nenhum dado pessoal em parâmetro de evento", () => assert.ok(!JSON.stringify(s.q).match(/Teste Simulador|27999990000|5527999990000/)));
check("n8n recebe origem e click IDs no payload", () => { assert.ok(guia.attribution && guia.attribution.first && guia.attribution.ids); assert.ok("channel_last" in guia.attribution); });

const f = await session(b, { area: "comercio", what: "Loja de móveis" });
check("fora da saúde: nenhuma conversão padrão em plataforma nenhuma", () => {
  assert.equal(f.q.fbq.filter((a) => a[0] === "track" && a[1] !== "PageView").length, 0);
  assert.equal(f.q.ttq.filter((a) => a[0] === "track" && ["SubmitForm", "Contact", "CompleteRegistration"].includes(a[1])).length, 0);
  assert.equal(f.q.gtag.filter((a) => a[0] === "event" && ["generate_lead", "sign_up", "conversion"].includes(a[1])).length, 0);
});

const t = await session(b, { query: "?teste=1" });
check("?teste=1: anúncios mudos; GA4 com debug_mode; n8n com is_test", () => {
  assert.equal(t.q.test, true);
  assert.equal(t.q.fbq.filter((a) => a[0] === "track" && a[1] !== "PageView").length + t.q.fbq.filter((a) => a[0] === "trackCustom").length, 0);
  assert.equal(t.q.ttq.filter((a) => a[0] === "track").length, 0);
  const ga = t.q.gtag.filter((a) => a[0] === "event" && a[1] === "generate_lead"); assert.equal(ga.length, 1); assert.equal(ga[0][2].debug_mode, true);
  assert.ok(t.posts.every((p) => p.is_test === true));
});
await b.close();
console.log(ok.map((n) => "PASS " + n).join("\n"));
