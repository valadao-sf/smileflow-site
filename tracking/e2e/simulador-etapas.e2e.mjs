import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || "playwright-core");
const ORIGIN = process.env.SITE || "http://127.0.0.1:3091";
const CHROME = process.env.CHROME || "/usr/bin/google-chrome";
const TEST_IDS = {
  ga4: { id: "G-TEST" },
  meta: { pixelId: "META_TEST" },
  googleAds: {
    id: "AW-1",
    labels: {
      diagnostico_concluido: "LD",
      guia_liberado: "LG",
      pedido_contato: "LC",
      clique_whatsapp: "LW",
    },
  },
  tiktok: { pixelId: "TT1" },
  microsoftUet: { tagId: "UET1" },
  clarity: { projectId: "CL1" },
};
const trackJs = readFileSync(new URL("../../public/_sf/track.js", import.meta.url), "utf8")
  .replace(/var CFG = (\{.*?\});\n/s, (_, json) =>
    `var CFG = ${JSON.stringify({ ...JSON.parse(json), ...TEST_IDS })};\n`);

const viewports = [
  { name: "390x844", viewport: { width: 390, height: 844 } },
  { name: "768x900", viewport: { width: 768, height: 900 } },
  { name: "1440x900", viewport: { width: 1440, height: 900 } },
];
const trackedEventNames = new Set([
  "resultado_simulacao",
  "clique_whatsapp",
  "sign_up",
  "guia_pdf_baixado",
  "clique_guia_instagram",
]);
const results = { events: {}, posts: [] };
let failures = 0;

function mapa(pathname) {
  if (pathname === "/simulador-objecoes") return "/simulador-objecoes/index.html";
  if (pathname === "/perfil-de-negociacao") return "/perfil-de-negociacao.html";
  if (pathname.startsWith("/simulador-objecoes/")) {
    const finalSegment = pathname.slice(pathname.lastIndexOf("/") + 1);
    if (!finalSegment.includes(".")) return `${pathname}.html`;
  }
  return pathname;
}

async function queueFrom(page) {
  return page.evaluate(() => {
    const queue = (window.dataLayer || [])
      .filter((item) => item && typeof item === "object" && "0" in item)
      .map((item) => Array.from(item));
    return { queue, json: JSON.stringify(queue) };
  });
}

function matchingEvents(queue, name) {
  return queue.filter((item) => item[0] === "event" && item[1] === name);
}

function eventParams(event) {
  return event?.[2] && typeof event[2] === "object" ? event[2] : {};
}

function postEventId(post) {
  return post?.event_id ?? post?.payload?.event_id ?? post?.data?.event_id;
}

async function runViewport({ name, viewport }) {
  const posts = [];
  const blocked = [];
  const pageErrors = [];
  const telemetryJson = [];
  const telemetryErrors = [];
  const capturedEvents = [];
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  context.on("page", (popup) => {
    if (popup !== page) void popup.close();
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await context.route("**/*", (route) => {
    blocked.push({ url: route.request().url(), method: route.request().method() });
    return route.abort();
  });
  await context.route("https://smileflow.com.br/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/_sf/track.js") {
      await route.fulfill({ body: trackJs, contentType: "text/javascript" });
      return;
    }
    const response = await fetch(`${ORIGIN}${mapa(url.pathname)}${url.search}`);
    await route.fulfill({
      status: response.status,
      body: await response.text(),
      headers: { "content-type": response.headers.get("content-type") || "text/html" },
    });
  });
  const igBlocked = [];
  await context.route(/ig\.me|instagram\.com/, (route) => {
    igBlocked.push(route.request().url());
    return route.abort();
  });
  await context.route(/n8n\.smileflow\.me/, async (route) => {
    if (route.request().method() === "POST") {
      const postData = route.request().postData();
      if (postData) posts.push(JSON.parse(postData));
    }
    await route.fulfill({
      status: 200,
      headers: { "access-control-allow-origin": "https://smileflow.com.br" },
      body: "",
    });
  });
  await context.route(/bat\.bing\.com/, (route) =>
    route.fulfill({
      body: "window.__uet=[];window.UET=function(o){(o.q||[]).forEach(function(a){window.__uet.push(a)});this.push=function(){window.__uet.push([].slice.call(arguments))}};",
      contentType: "text/javascript",
    }));
  await context.route(
    /googletagmanager|google-analytics|googleadservices|doubleclick|connect\.facebook|facebook\.com|analytics\.tiktok|clarity\.ms|pandavideo|jsdelivr/,
    (route) => route.fulfill({ body: "", contentType: "text/javascript" }),
  );
  async function captureCurrentPage() {
    if (!page.url().startsWith("https://smileflow.com.br")) return;
    try {
      const { queue, json } = await queueFrom(page);
      telemetryJson.push(json);
      for (const event of queue) {
        if (event[0] === "event" && trackedEventNames.has(event[1])) {
          capturedEvents.push([event[1], Object.keys(eventParams(event)).sort()]);
        }
      }
    } catch (error) {
      telemetryErrors.push(error instanceof Error ? error.message : String(error));
    }
  }

  async function visit(path) {
    await captureCurrentPage();
    await page.goto(`https://smileflow.com.br${path}`, { waitUntil: "domcontentloaded" });
  }

  async function check(label, fn) {
    try {
      await fn();
      console.log(`PASS ${name} ${label}`);
    } catch (error) {
      failures += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`FAIL ${name} ${label}: ${message}`);
    }
  }

  async function waitForScene(expected, timeout = 10000) {
    await page.waitForFunction((scene) => typeof S !== "undefined" && S.scene === scene, expected, { timeout });
  }

  async function assertOnlyScene(expected) {
    const state = await page.evaluate(() => ({
      scene: (typeof S !== "undefined" ? S.scene : undefined),
      visible: [...document.querySelectorAll("section.scene")]
        .filter((scene) => !scene.hidden)
        .map((scene) => scene.id),
    }));
    assert.equal(state.scene, expected, `S.scene esperado ${expected}, recebido ${state.scene}`);
    assert.deepEqual(state.visible, [`s-${expected}`], `cenas visíveis em ${expected}: ${state.visible.join(", ")}`);
  }

  await check("1 tela inicial", async () => {
    await visit("/simulador-objecoes");
    await waitForScene("hub");
    const state = await page.evaluate(() => ({
      scene: (typeof S !== "undefined" ? S.scene : undefined),
      visible: [...document.querySelectorAll("section.scene")].filter((s) => !s.hidden).map((s) => s.id),
      hubHidden: document.querySelector("#s-hub")?.hidden,
      text: document.body.innerText,
      title: document.title.trim(),
    }));
    assert.equal(state.scene, "hub");
    assert.deepEqual(state.visible, ["s-hub"]);
    assert.equal(state.hubHidden, false);
    assert.match(state.text, /Escolha uma objeção para treinar/);
    assert.ok(state.title, "document.title vazio");
  });

  await check("2 simulação ex e transições", async () => {
    const sequence = [];
    const invariantErrors = [];
    await page.locator('.ocx[data-obj="ta-caro"]').click();
    await page.waitForURL(/https:\/\/smileflow\.com\.br\/simulador-objecoes\/ta-caro\?ex=sim/);
    await waitForScene("v1");

    for (let step = 0; step < 90; step += 1) {
      const scene = await page.evaluate(() => (typeof S !== "undefined" ? S.scene : undefined) || "");
      if (sequence.at(-1) !== scene) {
        sequence.push(scene);
        await page.waitForTimeout(600);
        const state = await page.evaluate(() => ({ scene: (typeof S !== "undefined" ? S.scene : undefined), visible: [...document.querySelectorAll("section.scene")].filter((s) => !s.hidden).map((s) => s.id) }));
        if (state.visible.length !== 1 || state.visible[0] !== `s-${state.scene}`) {
          invariantErrors.push(`esperava somente s-${state.scene}; visíveis: ${state.visible.join(", ")}`);
        }
        const objScene = page.locator("#s-obj");
        if (state.scene !== "obj" && await objScene.count() &&
            await objScene.evaluate((element) => !element.hidden)) {
          invariantErrors.push("#s-obj permaneceu visível");
        }
      }
      if (scene === "final") break;
      await page.evaluate((currentScene) => {
        const root = document.querySelector("#s-" + currentScene);
        const visible = (element) => element.offsetParent && !element.disabled;
        const choice = [...root.querySelectorAll(".opt, .choice, .dopt")].find(visible) ||
          [...root.querySelectorAll(".btn-main, .btn-wine, .btn")].find(visible);
        choice && choice.click();
      }, scene);
      await page.waitForTimeout(700);
    }

    assert.deepEqual(sequence, ["v1", "r0", "v2", "r1", "final"]);
    assert.deepEqual(invariantErrors, [], invariantErrors.join("; "));
    await assertOnlyScene("final");
  });

  await check("3 evento resultado_simulacao", async () => {
    const { queue } = await queueFrom(page);
    const events = matchingEvents(queue, "resultado_simulacao");
    assert.equal(events.length, 1, `resultado_simulacao encontrados: ${events.length}`);
    const params = eventParams(events[0]);
    assert.equal(params.objection, "ta-caro");
    assert.equal(params.objecao, "ta-caro");
    assert.ok("ab" in params && "has_whatsapp" in params);
  });

  await check("4 objeção sem ex inicia a simulação", async () => {
    await visit("/simulador-objecoes/ta-caro");
    await waitForScene("obj");
    await assertOnlyScene("obj");
    const clicked = await page.evaluate(() => {
      const visible = (element) => element.offsetParent && !element.disabled;
      const primary = [...document.querySelectorAll("#s-obj [data-sim]")].find(visible);
      const fallback = [...document.querySelectorAll(
        "#s-obj button[data-obj], #s-obj a[data-ex='sim']",
      )].find(visible);
      const target = primary || fallback;
      if (!target) return false;
      target.click();
      return true;
    });
    assert.ok(clicked, "nenhum controle visível para iniciar a simulação em #s-obj");
    await waitForScene("v1");
    await page.waitForTimeout(700);
    await assertOnlyScene("v1");
  });

  await check("5 perfil de negociação e eventos", async () => {
    await visit("/perfil-de-negociacao");
    const sceneVisibilityErrors = [];
    const rememberVisibleScene = async () => {
      const visible = await page.evaluate(() => [...document.querySelectorAll("section.scene")]
        .filter((scene) => !scene.hidden)
        .map((scene) => scene.id));
      if (visible.length !== 1) sceneVisibilityErrors.push(`visíveis: ${visible.join(", ")}`);
    };
    await rememberVisibleScene();
    await page.locator("#fn-go").click();
    await page.locator("#fn-name").waitFor({ state: "visible" });
    await rememberVisibleScene();
    await page.locator("#fn-name").fill("Teste Etapas");
    await page.locator("#fn-phone").fill("27999990000");
    await page.locator("#fn-ok").check();
    await page.locator("#fn-go").click();

    const areaOption = page.locator('#s-fn .fx-opt[data-fa="saude_estetica"]');
    await areaOption.waitFor({ state: "visible" });
    await rememberVisibleScene();
    await areaOption.click();
    await page.waitForTimeout(500);
    await rememberVisibleScene();

    let reachedVfn = false;
    for (let step = 0; step < 15; step += 1) {
      if (await page.evaluate(() => (typeof S !== "undefined" ? S.scene : undefined) === "vfn")) {
        reachedVfn = true;
        break;
      }
      const action = await page.evaluate(() => {
        const visible = (element) => element.offsetParent && !element.disabled;
        const option = [...document.querySelectorAll("#s-fn .fx-opt")].find(visible);
        if (option) {
          option.click();
          return "option";
        }
        const open = document.querySelector("#fn-open");
        if (open && visible(open)) {
          open.value = "teste";
          open.dispatchEvent(new Event("input", { bubbles: true }));
          open.dispatchEvent(new Event("change", { bubbles: true }));
          const go = document.querySelector("#fn-go");
          if (go && visible(go)) go.click();
          return "open";
        }
        const go = document.querySelector("#fn-go");
        if (go && visible(go)) {
          go.click();
          return "go";
        }
        return "none";
      });
      if (action === "none") break;
      await page.waitForTimeout(500);
      await rememberVisibleScene();
      reachedVfn = await page.evaluate(() => (typeof S !== "undefined" ? S.scene : undefined) === "vfn");
      if (reachedVfn) break;
    }
    assert.ok(reachedVfn || await page.evaluate(() => (typeof S !== "undefined" ? S.scene : undefined) === "vfn"),
      "roteiro não chegou à cena vfn em até 15 passos");
    await rememberVisibleScene();

    const whatsapp = page.locator('#s-vfn a[data-wa="funil"]');
    await whatsapp.evaluate((anchor) => {
      anchor.addEventListener("click", (event) => event.preventDefault(), { once: true });
      anchor.click();
    });
    await page.waitForTimeout(300);

    const { queue } = await queueFrom(page);
    const signUps = matchingEvents(queue, "sign_up");
    const whatsappEvents = matchingEvents(queue, "clique_whatsapp");
    const perfilPost = posts.find((post) => post.type === "perfil");
    const whatsappPost = posts.find((post) => post.type === "whatsapp");
    assert.equal(signUps.length, 1, `sign_up encontrados: ${signUps.length}`);
    assert.equal(eventParams(signUps[0]).method, "guia");
    assert.ok(perfilPost, "POST type=perfil ausente");
    assert.equal(eventParams(signUps[0]).event_id, postEventId(perfilPost));
    assert.equal(whatsappEvents.length, 1, `clique_whatsapp encontrados: ${whatsappEvents.length}`);
    assert.equal(eventParams(whatsappEvents[0]).where, "funil");
    assert.ok(whatsappPost, "POST type=whatsapp ausente");
    assert.equal(eventParams(whatsappEvents[0]).event_id, postEventId(whatsappPost));
    assert.deepEqual(sceneVisibilityErrors, [], sceneVisibilityErrors.join("; "));
  });

  await check("6 download do guia", async () => {
    await visit("/simulador-objecoes/guia/ta-caro");
    await page.locator("#guia-pdf").evaluate((anchor) => {
      anchor.addEventListener("click", (event) => event.preventDefault(), { once: true });
      anchor.click();
    });
    const { queue } = await queueFrom(page);
    const events = matchingEvents(queue, "guia_pdf_baixado");
    assert.equal(events.length, 1, `guia_pdf_baixado encontrados: ${events.length}`);
    const params = eventParams(events[0]);
    assert.equal(params.objection, "ta-caro");
    assert.equal(params.objecao, "ta-caro");
    assert.equal(params.where, "botao");
  });

  await check("8 clique_guia_instagram só no GA4 (tela inicial e final)", async () => {
    const vendorState = () => page.evaluate(() => ({
      fbq: JSON.stringify((window.fbq && window.fbq.queue || []).map((a) => Array.from(a))),
      ttq: JSON.stringify((Array.isArray(window.ttq) ? window.ttq : []).filter(Array.isArray)),
      uet: JSON.stringify([].concat(Array.isArray(window.uetq) ? window.uetq : [], window.__uet || [])),
      conversions: (window.dataLayer || []).filter((x) => x && typeof x === "object" && x[0] === "event" && x[1] === "conversion").length,
    }));
    const clickGuide = async (where) => {
      const before = await vendorState();
      const link = page.locator(`a[data-out="instagram-guia"][data-where="${where}"]`).first();
      assert.equal(await link.count(), 1, `botão do guia (${where}) ausente`);
      await link.evaluate((anchor) => {
        anchor.addEventListener("click", (event) => event.preventDefault(), { once: true });
        anchor.click();
      });
      await page.waitForTimeout(300);
      const after = await vendorState();
      const { queue } = await queueFrom(page);
      const events = matchingEvents(queue, "clique_guia_instagram");
      assert.equal(events.length, 1, `clique_guia_instagram (${where}) encontrados: ${events.length}`);
      assert.equal(eventParams(events[0]).where, where);
      assert.equal(eventParams(events[0]).send_to, "G-TEST");
      for (const k of ["fbq", "ttq", "uet"]) {
        assert.doesNotMatch(after[k], /clique_guia_instagram|guia_ig/, `${k} recebeu o evento (${where})`);
        assert.equal(after[k], before[k], `${k} mudou com o clique (${where})`);
      }
      assert.equal(after.conversions, before.conversions, `conversão do Ads com o clique (${where})`);
      assert.ok(page.url().startsWith("https://smileflow.com.br"), "saiu do site");
    };
    await visit("/simulador-objecoes");
    await waitForScene("hub");
    await clickGuide("hub");
    await visit("/simulador-objecoes/ta-caro?ex=sim");
    await waitForScene("v1");
    for (let step = 0; step < 90; step += 1) {
      const scene = await page.evaluate(() => (typeof S !== "undefined" ? S.scene : undefined) || "");
      if (scene === "final") break;
      await page.evaluate((currentScene) => {
        const root = document.querySelector("#s-" + currentScene);
        const visible = (element) => element.offsetParent && !element.disabled;
        const choice = [...root.querySelectorAll(".opt, .choice, .dopt")].find(visible) ||
          [...root.querySelectorAll(".btn-main, .btn-wine, .btn")].find(visible);
        choice && choice.click();
      }, scene);
      await page.waitForTimeout(700);
    }
    await waitForScene("final");
    await page.waitForTimeout(600);
    await clickGuide("final");
  });

  await captureCurrentPage();
  await check("7 erros, privacidade e POSTs", async () => {
    assert.deepEqual(pageErrors, [], pageErrors.join("; "));
    assert.deepEqual(telemetryErrors, [], telemetryErrors.join("; "));
    const allTelemetry = telemetryJson.join("\n");
    assert.doesNotMatch(allTelemetry, /Teste Etapas|27999990000|5527999990000/);
    const outsidePosts = blocked.filter((request) => request.method === "POST");
    assert.deepEqual(outsidePosts, [], JSON.stringify(outsidePosts));
  });

  results.events[name] = capturedEvents;
  results.posts.push(...posts.map((post) => post.type));
  await context.close();
}

const browser = await chromium.launch({ headless: true, executablePath: CHROME });
try {
  for (const viewport of viewports) await runViewport(viewport);
} finally {
  await browser.close();
}

if (process.env.E2E_OUT) {
  writeFileSync(process.env.E2E_OUT, `${JSON.stringify(results, null, 2)}\n`);
}
process.exit(failures ? 1 : 0);
