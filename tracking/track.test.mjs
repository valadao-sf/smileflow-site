// node --test tracking/track.test.mjs   (rode antes: node tracking/build.mjs)
import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./harness.mjs";

const ALL = (c) => ({ ...c, googleAds: { id: "AW-1", labels: { diagnostico_concluido: "LBL_DIAG", guia_liberado: "LBL_GUIA", pedido_contato: "LBL_CB", clique_whatsapp: "LBL_WA" } },
  tiktok: { pixelId: "TT1" }, microsoftUet: { tagId: "UET1" }, clarity: { projectId: "CL1" }, linkedin: { partnerId: "LI1", conversions: { diagnostico_concluido: "99" } },
  pinterest: { tagId: "PIN1" }, kwai: { pixelId: "KW1" } });
const events = (g, name) => g.gtagCalls().filter((a) => a[0] === "event" && (!name || a[1] === name));

test("ID vazio não carrega; ID preenchido carrega", () => {
  const NONE = (c) => ({ ...c, googleAds: { id: "", labels: {} }, clarity: { projectId: "" } });
  const off = load({ config: NONE });
  assert.deepEqual(Object.keys(off.w.sfTrack.vendors).sort(), ["ga4", "meta"]);
  assert.ok(!off.calls.scripts.some((s) => /tiktok|bat\.bing|clarity|licdn|pinimg|kwai/.test(s)));
  const on = load({ config: ALL });
  assert.deepEqual(Object.keys(on.w.sfTrack.vendors).sort(), ["clarity", "ga4", "googleAds", "kwai", "linkedin", "meta", "microsoftUet", "pinterest", "tiktok"]);
});

test("fora de smileflow.com.br nada carrega", () => {
  const g = load({ url: "https://smileflow-marketing.vercel.app/simulador-objecoes/ta-caro", config: ALL });
  assert.equal(g.calls.scripts.length, 0);
  assert.equal(g.w.sfTrack.isTest, true);
});

test("diagnóstico com WhatsApp de saúde e estética vira a conversão padrão em cada plataforma, uma vez, com o mesmo event_id", () => {
  const g = load({ config: ALL });
  const id = g.w.sfTrack("diagnostico_concluido", { segment_group: "saude_estetica", has_whatsapp: true, value: 900, phase: "fechar", name: "Teste Simulador", phone: "5527999990000" }, { eventId: "ev-1" });
  g.w.sfTrack("diagnostico_concluido", { segment_group: "saude_estetica", has_whatsapp: true, value: 900 }, { eventId: "ev-1" });   // repetido
  assert.equal(id, "ev-1");
  const ga = events(g, "generate_lead");
  assert.equal(ga.length, 1);
  assert.equal(ga[0][2].lead_type, "diagnostico"); assert.equal(ga[0][2].value, 900); assert.equal(ga[0][2].currency, "BRL"); assert.equal(ga[0][2].event_id, "ev-1");
  assert.ok(!("name" in ga[0][2]) && !("phone" in ga[0][2]), "dado pessoal não vai em parâmetro");
  assert.deepEqual(g.calls.fbq.map((c) => [c[0], c[1], c[3]]), [["track", "Lead", { eventID: "ev-1" }]]);
  assert.deepEqual(g.calls.ttq.map((c) => [c[0], c[2]]), [["SubmitForm", { event_id: "ev-1" }]]);
  assert.equal(g.calls.uetq[0][1], "submit_lead_form"); assert.equal(g.calls.uetq[0][2].revenue_value, 900);
  const ads = events(g, "conversion"); assert.equal(ads.length, 1);
  assert.equal(ads[0][2].send_to, "AW-1/LBL_DIAG"); assert.equal(ads[0][2].transaction_id, "ev-1");
  assert.deepEqual(g.calls.lintrk, [["track", { conversion_id: 99, event_id: "ev-1" }]]);
  assert.equal(g.calls.pintrk[0][1], "lead");
});

test("quem não é de saude_estetica nunca vira Lead/Contact padrão em plataforma nenhuma", () => {
  for (const seg of ["fora_saude", "saude_outra", ""]) {
    const g = load({ config: ALL });
    for (const [n, extra] of [["diagnostico_concluido", { has_whatsapp: true }], ["guia_liberado", {}], ["pedido_contato", {}], ["clique_whatsapp", {}]])
      g.w.sfTrack(n, { segment_group: seg, ...extra });
    const STD = ["Lead", "Contact", "CompleteRegistration", "SubmitForm", "generate_lead", "sign_up", "submit_lead_form", "contact", "lead", "signup"];
    assert.equal(g.calls.fbq.filter((c) => c[0] === "track").length, 0, seg);
    assert.ok(g.calls.fbq.every((c) => c[0] === "trackCustom"));
    assert.ok(!g.calls.ttq.some((c) => STD.includes(c[0])), seg);
    assert.ok(!g.calls.uetq.some((c) => STD.includes(c[1])), seg);
    assert.ok(!events(g).some((c) => STD.includes(c[1]) || c[1] === "conversion"), seg);
    assert.equal(g.calls.lintrk.length + g.calls.pintrk.length + g.calls.kwaiq.length, 0, seg);
  }
});

test("diagnóstico sem WhatsApp não é a conversão principal", () => {
  const g = load({ config: ALL });
  g.w.sfTrack("diagnostico_concluido", { segment_group: "saude_estetica", has_whatsapp: false });
  assert.equal(events(g, "generate_lead").length, 0);
  assert.equal(events(g, "diagnostico_concluido").length, 1);
  assert.equal(g.calls.fbq[0][0], "trackCustom");
});

test("secundárias: guia, pedido de contato e WhatsApp", () => {
  const g = load({ config: ALL });
  g.w.sfTrack("guia_liberado", { segment_group: "saude_estetica" }, { eventId: "g" });
  g.w.sfTrack("pedido_contato", { segment_group: "saude_estetica" }, { eventId: "c" });
  g.w.sfTrack("clique_whatsapp", { segment_group: "saude_estetica" }, { eventId: "w" });
  assert.deepEqual(g.calls.fbq.map((c) => c[1]), ["CompleteRegistration", "Contact", "Contact"]);
  assert.deepEqual(g.calls.ttq.map((c) => c[0]), ["CompleteRegistration", "Contact", "Contact"]);
  assert.deepEqual(events(g).filter((c) => c[1] !== "conversion").map((c) => c[1]), ["sign_up", "pedido_contato", "clique_whatsapp"]);
  assert.deepEqual(events(g, "conversion").map((c) => c[2].send_to), ["AW-1/LBL_GUIA", "AW-1/LBL_CB", "AW-1/LBL_WA"]);
});

test("?teste=1: GA4 com debug_mode; anúncios não disparam; vale para a sessão", () => {
  const g = load({ url: "https://smileflow.com.br/simulador-objecoes/ta-caro?teste=1", config: ALL });
  assert.equal(g.w.sfTrack.isTest, true);
  g.w.sfTrack("diagnostico_concluido", { segment_group: "saude_estetica", has_whatsapp: true });
  const ga = events(g, "generate_lead"); assert.equal(ga.length, 1); assert.equal(ga[0][2].debug_mode, true);
  assert.ok(g.gtagCalls().some((a) => a[0] === "config" && a[2] && a[2].debug_mode === true));
  assert.equal(g.calls.fbq.length + g.calls.ttq.length + g.calls.uetq.length + events(g, "conversion").length, 0);
  const next = load({ url: "https://smileflow.com.br/", storage: { session: { sf_test: "1" } } });
  assert.equal(next.w.sfTrack.isTest, true);
});

test("origem: primeiro e último toque, click IDs, referrer e canal", () => {
  const a = load({ url: "https://smileflow.com.br/simulador-objecoes/ta-caro?utm_source=meta&utm_medium=paid&utm_campaign=mnc&fbclid=FB123", referrer: "https://l.instagram.com/" });
  const at = a.w.sfTrack.attribution();
  assert.equal(at.first.utm_campaign, "mnc"); assert.equal(at.first.fbclid, "FB123"); assert.equal(at.first.referrer, "https://l.instagram.com/");
  assert.equal(at.first.landing, "/simulador-objecoes/ta-caro?utm_source=meta&utm_medium=paid&utm_campaign=mnc&fbclid=FB123");
  assert.equal(at.channel_first, "meta_ads");
  assert.match(a.w.sfTrack.ids().fbc, /^fb\.1\.\d+\.FB123$/);
  const saved = { local: { sf_attr: a.w.localStorage.getItem("sf_attr") } };
  // volta direto: último toque não muda
  const b = load({ url: "https://smileflow.com.br/", storage: saved });
  assert.equal(b.w.sfTrack.attribution().last.fbclid, "FB123");
  // volta pelo Google Ads: primeiro continua Meta, último vira Google
  const c = load({ url: "https://smileflow.com.br/?gclid=G1&gbraid=GB1", storage: saved });
  const ac = c.w.sfTrack.attribution();
  assert.equal(ac.first.fbclid, "FB123"); assert.equal(ac.last.gclid, "G1"); assert.equal(ac.channel_last, "google_ads");
  assert.equal(c.w.sfTrack.ids().gbraid, "GB1");
  for (const [ref, ch] of [["https://chatgpt.com/", "assistente_ia"], ["https://www.perplexity.ai/", "assistente_ia"], ["https://www.google.com/", "busca_organica"], ["", "direto"]]) {
    const x = load({ url: "https://smileflow.com.br/", referrer: ref });
    assert.equal(x.w.sfTrack.attribution().channel_last, ch, ref);
  }
  const t = load({ url: "https://smileflow.com.br/?ttclid=TT9&msclkid=MS9&li_fat_id=LI9&wbraid=WB9" });
  const it = t.w.sfTrack.ids(); assert.equal(it.ttclid, "TT9"); assert.equal(it.msclkid, "MS9"); assert.equal(it.wbraid, "WB9");
  assert.equal(t.w.sfTrack.attribution().last.li_fat_id, "LI9");
});

test("consentimento obrigatório: GA4 sem cookie antes; anúncios e Clarity só depois do aceite", () => {
  const g = load({ config: (c) => ({ ...ALL(c), consent: { required: true } }) });
  assert.deepEqual(Object.keys(g.w.sfTrack.vendors), ["ga4"]);
  const def = g.gtagCalls().find((a) => a[0] === "consent" && a[1] === "default");
  assert.equal(def[2].ad_storage, "denied"); assert.equal(def[2].analytics_storage, "denied");
  g.w.sfTrack.consent({ ads: true, analytics: true });
  assert.ok(g.w.sfTrack.vendors.meta && g.w.sfTrack.vendors.tiktok && g.w.sfTrack.vendors.clarity);
  const upd = g.gtagCalls().find((a) => a[0] === "consent" && a[1] === "update");
  assert.equal(upd[2].ad_user_data, "granted");
});

test("chamadas feitas antes do script carregar entram na fila", () => {
  const g = load({ pre: (w) => { w.sfTrack = function () { (w.sfTrack.q = w.sfTrack.q || []).push(arguments); }; w.sfTrack("guia_liberado", { segment_group: "saude_estetica" }, { eventId: "fila-1" }); } });
  assert.equal(typeof g.w.sfTrack.attribution, "function");
  assert.ok(g.w.dataLayer.some((x) => x.event === "sf_guia_liberado" && x.event_id === "fila-1"));
});
