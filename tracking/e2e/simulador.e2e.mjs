// Prova no navegador: o simulador servido como smileflow.com.br, com todas as plataformas ligadas (IDs de teste)
// e os scripts delas trocados por filas. Confere: um disparo por evento, mesmo event_id no pixel e no n8n,
// não-saúde nunca vira conversão padrão, vídeos com marcos únicos e ?teste=1 sem chamadas de plataforma.
// Uso: npx next start -p 3077 & ; PW=<caminho do playwright-core> node tracking/e2e/simulador.e2e.mjs
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || "playwright-core");
const ORIGIN = process.env.SITE || "http://localhost:3077";
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TEST_IDS = { ga4: { id: "G-TEST" }, meta: { pixelId: "META_TEST" }, googleAds: { id: "AW-1", labels: { diagnostico_concluido: "LD", guia_liberado: "LG", pedido_contato: "LC", clique_whatsapp: "LW" } },
  tiktok: { pixelId: "TT1" }, microsoftUet: { tagId: "UET1" }, clarity: { projectId: "CL1" } };
const trackJs = readFileSync(new URL("../../public/_sf/track.js", import.meta.url), "utf8")
  .replace(/var CFG = (\{.*?\});\n/s, (_, j) => `var CFG = ${JSON.stringify({ ...JSON.parse(j), ...TEST_IDS })};\n`);

async function session(b, { query = "", area = "saude_estetica", what = "Clínica odontológica", path = "/simulador-objecoes/ta-caro", videoOnly = false }) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const posts = [], platformRequests = [], blocked = [];
  await ctx.route("**/*", async (r) => {
    const url = r.request().url();
    if (!url.startsWith("https://smileflow.com.br/")) { blocked.push(url); return r.abort(); }
    await r.continue();
  });
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
  pg.on("request", (r) => { if (/facebook|google-analytics|googletagmanager|googleadservices|doubleclick|n8n/i.test(r.url())) platformRequests.push(r.url()); });
  await pg.goto("https://smileflow.com.br" + path + query); await pg.waitForTimeout(1200);
  if (!videoOnly) {
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
  }
  await pg.evaluate(({ area, what }) => { S.biz = area; S.name = "Ana"; S.other = what; go("vsl"); }, { area, what });
  await pg.waitForTimeout(300);
  const soundVideo = async (sel) => pg.evaluate(({ sel }) => {
    const v = document.querySelector(sel); if (!v) throw new Error("video not found: " + sel);
    Object.defineProperty(v, "duration", { configurable: true, value: 100 });
    Object.defineProperty(v, "currentTime", { configurable: true, writable: true, value: 0 });
    Object.defineProperty(v, "paused", { configurable: true, value: false });
    const k = v.closest(".vfull").dataset.vkey; if (MEDIA[k]) MEDIA[k].script = false; v.closest(".vfull").classList.remove("failed"); // simula HLS carregado
    v.muted = true; v.dispatchEvent(new Event("play")); v.dispatchEvent(new Event("timeupdate"));
  }, { sel });
  await soundVideo("#s-vsl video");
  await pg.$eval("#s-vsl .vtap", (b) => b.click());
  const finishVideo = async (sel) => pg.evaluate(({ sel }) => {
    const v = document.querySelector(sel);
    for (let round = 0; round < 2; round++) {
      for (const p of [25, 50, 75]) { v.currentTime = p; v.dispatchEvent(new Event("timeupdate")); }
      v.currentTime = 100; v.dispatchEvent(new Event("timeupdate")); v.dispatchEvent(new Event("ended"));
    }
  }, { sel });
  await finishVideo("#s-vsl video");
  await pg.evaluate(({ area, what }) => { go("vfn"); }, { area, what });
  await pg.evaluate(() => { S.fnAns = { desejo: "fechar 1234567 tratamentos" }; });
  await pg.waitForTimeout(200);
  await soundVideo("#s-vfn video");
  await pg.$eval("#s-vfn .vtap", (b) => b.click());
  await finishVideo("#s-vfn video");
  const waText = await pg.$eval('#s-vsl a[data-wa="vsl"]', (a) => decodeURIComponent(new URL(a.href).searchParams.get("text") || ""));
  await pg.$eval('#s-vsl a[data-wa="vsl"]', (a) => { a.target = "_self"; a.addEventListener("click", e => e.preventDefault(), { once: true }); });
  await pg.$eval('#s-vsl a[data-wa="vsl"]', (a) => a.click()); await pg.waitForTimeout(250);
  const funilWa = pg.locator('#s-vfn a[data-wa="funil"]');
  if (await funilWa.count()) { await funilWa.evaluate((a) => { a.addEventListener("click", e => e.preventDefault(), { once: true }); }); await funilWa.evaluate((a) => a.click()); await pg.waitForTimeout(250); }
  const q = await pg.evaluate(() => ({
    fbq: (window.fbq && window.fbq.queue || []).map((a) => Array.from(a)), ttq: (window.ttq || []).filter(Array.isArray),
    uetq: window.__uet || [],
    gtag: window.dataLayer.filter((x) => x && typeof x === "object" && "0" in x).map((x) => Array.from(x)),
    vendors: Object.keys(window.sfTrack.vendors), test: window.sfTrack.isTest,
    videoGa: window.dataLayer.filter((x) => x && typeof x === "object" && x[0] === "event" && ["video_start", "video_progress", "video_complete"].includes(x[1])).map((x) => Array.from(x)),
    videoMeta: (window.fbq && window.fbq.queue || []).filter((a) => a[0] === "trackCustom" && /^vsl_(play|25|50|75|100)$/.test(a[1])).map((a) => Array.from(a)),
    videoIds: window.dataLayer.filter((x) => x && x[0] === "event" && /^video_/.test(x[1])).map((x) => x[2]),
    mncData: window.dataLayer.filter((x) => x && x.event && /^mnc_video_/.test(x.event)),
    funnelButton: window.dataLayer.filter((x) => x && x.event === "sf_funil_botao_whatsapp"),
  }));
  const funnelText = await pg.evaluate(() => funnelWaText());
  await ctx.close();
  return { q: JSON.parse(JSON.stringify(q)), posts, errs, waText, funnelText, platformRequests, blocked };
}

const b = await chromium.launch({ executablePath: CHROME, headless: true });
const ok = [];
const check = (name, fn) => { fn(); ok.push(name); };

const s = await session(b, {});
const guia = s.posts.find((p) => p.type === "guia");
check("sem erro de página", () => assert.deepEqual(s.errs, []));
check("todas as plataformas de teste carregaram", () => assert.deepEqual(s.q.vendors.sort(), ["clarity", "ga4", "googleAds", "meta", "microsoftUet", "tiktok"]));
check("guia: Meta CompleteRegistration uma vez, com o event_id do n8n", () => {
  const ev = s.q.fbq.filter((a) => a[0] === "track" && a[1] === "CompleteRegistration");
  assert.equal(ev.length, 1); assert.equal(ev[0][3].eventID, guia.event_id);
});
check("nenhum dado pessoal em parâmetro de evento", () => assert.ok(!JSON.stringify(s.q).match(/Teste Simulador|27999990000|5527999990000/)));
check("n8n recebe origem e click IDs no payload", () => { assert.ok(guia.attribution && guia.attribution.first && guia.attribution.ids); assert.ok("channel_last" in guia.attribution); });
check("dois vídeos: autoplay mudo não mede; cada marco audível é único por video_id", () => {
  assert.equal(s.q.videoGa.length, 10);
  assert.equal(s.q.videoMeta.length, 10);
  for (const id of new Set(s.q.videoGa.map((a) => a[2].video_id))) {
    const ga = s.q.videoGa.filter((a) => a[2].video_id === id);
    assert.deepEqual(ga.map((a) => a[1]), ["video_start", "video_progress", "video_progress", "video_progress", "video_complete"]);
    assert.deepEqual(ga.slice(1, 4).map((a) => a[2].video_percent), [25, 50, 75]);
    assert.ok(ga.every((a) => a[2].objecao && a[2].ab));
  }
});
check("WhatsApp: mesmo event_id na Meta e no POST, ref válido", () => {
  const post = s.posts.find((p) => p.type === "whatsapp" && p.where === "vsl"); assert.ok(post);
  const ev = s.q.fbq.find((a) => a[0] === "track" && a[1] === "Lead" && a[2].lead_type === "whatsapp_vsl");
  assert.ok(ev); assert.equal(ev[3].eventID, post.event_id);
  const ga = s.q.gtag.find((a) => a[0] === "event" && a[1] === "clique_whatsapp" && a[2].where === "vsl");
  assert.ok(ga); assert.equal(ga[2].objecao, post.objecao); assert.equal(ga[2].event_id, post.event_id);
  assert.match(post.ref, /^MNC-[a-z0-9]{4}$/); assert.match(s.waText, /\(Ref: MNC-[a-z0-9]{4}\)$/);
  for (const key of ["ref", "sid", "event_id", "objecao", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id", "gclid", "fbclid", "ttclid", "msclkid"]) assert.ok(key in post, key);
  const simPost = s.posts.find((p) => p.type === "whatsapp" && p.where === "funil");
  const simLead = s.q.fbq.find((a) => a[0] === "track" && a[1] === "Lead" && a[2].lead_type === "whatsapp_vsl" && a[3].eventID === simPost.event_id);
  assert.ok(simPost && simLead); assert.equal(simLead[3].eventID, simPost.event_id);
  assert.equal(s.q.gtag.filter((a) => a[0] === "event" && a[1] === "clique_whatsapp" && a[2].where === "funil").length, 1);
  assert.equal(s.q.gtag.filter((a) => a[0] === "event" && a[1] === "generate_lead").length, 0);
  assert.ok(s.funnelText.includes("1234567")); assert.match(s.funnelText, /\(Ref: MNC-[a-z0-9]{4}\)$/);
  const funnelEvent = s.q.funnelButton[0]; assert.ok(funnelEvent);
  const funnelMeta = s.q.fbq.filter((a) => a[2]?.event_id === funnelEvent.event_id);
  assert.equal(funnelMeta.length, 1); assert.deepEqual(funnelMeta[0].slice(0, 2), ["trackCustom", "funil_botao_whatsapp"]);
  assert.equal(s.q.fbq.filter((a) => a[2]?.event_id === funnelEvent.event_id && a[0] === "track").length, 0);
  assert.equal(funnelEvent.sf_standard, false);
  assert.equal(s.q.gtag.filter((a) => a[0] === "event" && a[1] === "funil_botao_whatsapp" && a[2].event_id === funnelEvent.event_id).length, 1);
  assert.equal(s.q.gtag.filter((a) => a[0] === "event" && ["conversion", "generate_lead"].includes(a[1]) && a[2].event_id === funnelEvent.event_id).length, 0);
  assert.equal(simLead[2].lead_type, "whatsapp_vsl");
});

const f = await session(b, { area: "comercio", what: "Loja de móveis" });
check("fora da saúde: nenhuma conversão padrão em plataforma nenhuma", () => {
  assert.equal(f.q.fbq.filter((a) => a[0] === "track" && a[1] !== "PageView").length, 0);
  assert.ok(f.q.fbq.some((a) => a[0] === "trackCustom" && a[1] === "clique_whatsapp"));
  assert.ok(f.q.gtag.some((a) => a[0] === "event" && a[1] === "clique_whatsapp"));
  assert.equal(f.q.ttq.filter((a) => a[0] === "track" && ["SubmitForm", "Contact", "CompleteRegistration"].includes(a[1])).length, 0);
  assert.equal(f.q.gtag.filter((a) => a[0] === "event" && ["generate_lead", "sign_up", "conversion"].includes(a[1])).length, 0);
});

const t = await session(b, { query: "?teste=1" });
check("?teste=1: nenhuma plataforma carrega/chama e n8n recebe is_test", () => {
  assert.equal(t.q.test, true);
  assert.equal(t.q.fbq.filter((a) => a[0] === "track" && a[1] !== "PageView").length + t.q.fbq.filter((a) => a[0] === "trackCustom").length, 0);
  assert.equal(t.q.ttq.filter((a) => a[0] === "track").length, 0);
  assert.equal(t.q.gtag.length, 0); assert.deepEqual(t.q.vendors, []); assert.deepEqual(t.platformRequests.filter((u) => !/n8n\.smileflow\.me/.test(u)), []);
  assert.ok(t.posts.every((p) => p.is_test === true));
});

const paths = ["/simulador-objecoes/index.html", "/simulador-objecoes/ta-caro", "/simulador-objecoes/vou-pensar", "/simulador-objecoes/desconto", "/simulador-objecoes/marido", "/simulador-objecoes/medo", "/simulador-objecoes/outra-clinica"];
const pageRuns = await Promise.all(paths.flatMap((path) => [session(b, { path, videoOnly: true }), session(b, { path, query: "?teste=1", videoOnly: true })]));
check("sete páginas, duas rodadas: marcos únicos por vídeo; teste sem vendors nem tentativas a plataformas", () => {
  for (let i = 0; i < pageRuns.length; i += 2) {
    const run = pageRuns[i], testRun = pageRuns[i + 1], path = paths[i / 2];
    assert.deepEqual(run.errs, [], path); assert.equal(run.q.videoGa.length, 10, path);
    assert.equal(run.q.videoMeta.length, 10, path);
    for (const id of new Set(run.q.videoGa.map((a) => a[2].video_id))) {
      const ga = run.q.videoGa.filter((a) => a[2].video_id === id), meta = run.q.videoMeta.filter((a) => a[2].video_id === id);
      assert.deepEqual(ga.map((a) => a[1]), ["video_start", "video_progress", "video_progress", "video_progress", "video_complete"], path);
      assert.deepEqual(meta.map((a) => a[1]), ["vsl_play", "vsl_25", "vsl_50", "vsl_75", "vsl_100"], path);
      assert.ok(ga.every((a) => a[2].objecao && a[2].ab), path);
    }
    assert.equal(testRun.q.test, true, path); assert.deepEqual(testRun.q.vendors, [], path);
    assert.equal(testRun.q.gtag.length, 0, path); assert.equal(testRun.q.fbq.length, 0, path);
    assert.deepEqual(testRun.platformRequests.filter((u) => !/n8n\.smileflow\.me/.test(u)), [], path);
    assert.deepEqual(testRun.blocked.filter((url) => /facebook|google-analytics|googletagmanager|googleadservices|doubleclick|n8n/i.test(url)), [], path);
    const post = run.posts.find((p) => p.type === "whatsapp" && p.where === "vsl"); assert.ok(post, path);
    assert.match(post.ref, /^MNC-[a-z0-9]{4}$/); assert.match(run.waText, /\(Ref: MNC-[a-z0-9]{4}\)$/);
  }
  const refs = pageRuns.filter((_, i) => i % 2 === 0).map((run) => run.posts.find((p) => p.type === "whatsapp" && p.where === "vsl").ref);
  assert.equal(new Set(refs).size, refs.length);
});
console.log(JSON.stringify(pageRuns.map((run, i) => ({ page: paths[Math.floor(i / 2)], round: i % 2 ? "teste" : "plataformas", milestones: Object.fromEntries([...new Set(run.q.videoGa.map((a) => a[2].video_id))].map((id) => [id, run.q.videoGa.filter((a) => a[2].video_id === id).map((a) => a[1])])), lead_type: run.q.fbq.find((a) => a[0] === "track" && a[1] === "Lead")?.[2].lead_type || null, event_id_equal: (() => { const p = run.posts.find((p) => p.type === "whatsapp" && p.where === "vsl"), e = run.q.fbq.find((a) => a[0] === "track" && a[1] === "Lead" && a[2].lead_type === "whatsapp_vsl"); return !!p && !!e && e[3].eventID === p.event_id; })(), ref: run.posts.find((p) => p.type === "whatsapp" && p.where === "vsl")?.ref || null, blocked_by_host: run.blocked.reduce((a, u) => { const h = new URL(u).host; a[h] = (a[h] || 0) + 1; return a; }, {}) })), null, 2));
await b.close();
console.log(ok.map((n) => "PASS " + n).join("\n"));
