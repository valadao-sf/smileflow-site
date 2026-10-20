/* gerado por tracking/build.mjs — não edite à mão */
/* sfTrack — camada única de medição de smileflow.com.br.
   Fonte: tracking/track.src.js + tracking/config.json → `node tracking/build.mjs` gera public/_sf/track.js.
   Carregado por todas as páginas do domínio (app smileflow, app smileflow-site e páginas estáticas).

   Uso:
     sfTrack('diagnostico_concluido', { segment_group: 'saude_estetica', has_whatsapp: true, value: 900 }, { eventId })
     sfTrack.attribution()  → { first, last, landing, referrer, ... } para mandar ao n8n
     sfTrack.ids()          → { fbp, fbc, ttp, ga_client_id, msclkid } para deduplicar no servidor
     sfTrack.consent({ ads: true, analytics: true })  → depois do aceite no banner
   Antes do script carregar, as páginas podem chamar o stub `sfTrack(...)`: as chamadas ficam na fila. */
(function (w, d) {
  'use strict';
  var CFG = {"hosts":["smileflow.com.br","www.smileflow.com.br"],"currency":"BRL","consent":{"required":false},"userData":{"enabled":false},"ga4":{"id":"G-ZC4Y4L1YQN"},"meta":{"pixelId":"888486630406077"},"googleAds":{"id":"","labels":{"diagnostico_concluido":"","guia_liberado":"","pedido_contato":"","clique_whatsapp":""}},"tiktok":{"pixelId":""},"microsoftUet":{"tagId":""},"clarity":{"projectId":""},"linkedin":{"partnerId":"","conversions":{"diagnostico_concluido":""}},"pinterest":{"tagId":""},"kwai":{"pixelId":""}};
  var prev = w.sfTrack, queue = (prev && prev.q) || [];
  if (prev && prev.loaded) return;

  /* ---------- ambiente ---------- */
  var host = (w.location && w.location.hostname) || '';
  var ON_HOST = (CFG.hosts || []).indexOf(host) >= 0;
  var qs = (function () { try { return new URLSearchParams(w.location.search); } catch (e) { return { get: function () { return null; } }; } })();
  var store = {
    get: function (k, s) { try { var v = (s ? w.sessionStorage : w.localStorage).getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set: function (k, v, s) { try { (s ? w.sessionStorage : w.localStorage).setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  // ?teste=1 vale para a sessão inteira (a pessoa navega e continua em teste). Fora do domínio, tudo é teste.
  if (qs.get('teste') === '1' || /^(1|true)$/.test(qs.get('is_test') || '')) store.set('sf_test', 1, true);
  var IS_TEST = !ON_HOST || !!store.get('sf_test', true);
  var cookie = function (n) { try { var m = d.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : ''; } catch (e) { return ''; } };
  var has = function (v) { return typeof v === 'string' ? v.trim() !== '' : !!v; };
  var uuid = function () { try { return w.crypto.randomUUID(); } catch (e) { return 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12); } };

  /* ---------- origem: primeiro e último toque ---------- */
  var ATTR_KEY = 'sf_attr', ATTR_DAYS = 90;
  var CLICK_IDS = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid', 'msclkid', 'li_fat_id', 'epik', 'twclid'];
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'creative', 'partner', 'intent'];
  function externalReferrer() {
    try { var r = d.referrer ? new URL(d.referrer) : null; return r && (CFG.hosts || []).indexOf(r.hostname) < 0 && r.hostname !== host ? r.origin + r.pathname : ''; } catch (e) { return ''; }
  }
  var attr = (function () {
    var saved = store.get(ATTR_KEY), now = Date.now();
    if (saved && saved.first && now - (saved.first.ts || 0) > ATTR_DAYS * 864e5) saved = null;
    var touch = { ts: now, landing: (w.location.pathname || '') + (w.location.search || ''), referrer: externalReferrer() };
    var signal = false;
    UTM_KEYS.concat(CLICK_IDS).forEach(function (k) { var v = qs.get(k); if (v) { touch[k] = String(v).slice(0, 300); signal = true; } });
    if (touch.referrer) signal = true;
    var out = saved || {};
    if (!out.first) out.first = touch;
    // último toque só muda quando chega um sinal novo (campanha, clique ou referência externa); navegação interna não apaga a origem
    if (signal || !out.last) out.last = touch;
    out.sessions = (out.sessions || 0) + (store.get('sf_seen', true) ? 0 : 1);
    store.set('sf_seen', 1, true);
    store.set(ATTR_KEY, out);
    return out;
  })();
  function channelOf(t) {
    if (!t) return 'direto';
    var s = (t.utm_source || '').toLowerCase(), m = (t.utm_medium || '').toLowerCase(), r = (t.referrer || '').toLowerCase();
    if (t.gclid || t.gbraid || t.wbraid) return 'google_ads';
    if (t.fbclid && /cpc|paid|ads/.test(m)) return 'meta_ads';
    if (t.ttclid) return 'tiktok_ads';
    if (t.msclkid) return 'microsoft_ads';
    if (t.li_fat_id) return 'linkedin_ads';
    if (/cpc|paid|ads|ppc/.test(m)) return (s || 'pago') + '_ads';
    if (/chatgpt|openai|perplexity|gemini\.google|copilot\.microsoft|claude\.ai|meta\.ai|deepseek|grok|you\.com/.test(r + ' ' + s)) return 'assistente_ia';
    if (s) return s + (m ? '_' + m : '');
    if (/instagram|l\.instagram|facebook|fb\.|threads/.test(r) || t.fbclid) return 'instagram_facebook_organico';
    if (/google\.|bing\.|duckduckgo|yahoo|ecosia/.test(r)) return 'busca_organica';
    if (/wa\.me|whatsapp/.test(r)) return 'whatsapp';
    if (r) return 'referencia';
    return 'direto';
  }
  function attribution() {
    return {
      first: attr.first, last: attr.last, sessions: attr.sessions,
      channel_first: channelOf(attr.first), channel_last: channelOf(attr.last),
      page: (w.location.pathname || ''), url: (w.location.origin || '') + (w.location.pathname || '')
    };
  }
  function ids() {
    var ga = cookie('_ga').split('.');
    return {
      fbp: cookie('_fbp'), fbc: cookie('_fbc') || (attr.last.fbclid ? 'fb.1.' + attr.last.ts + '.' + attr.last.fbclid : ''),
      ttp: cookie('_ttp'), ttclid: attr.last.ttclid || attr.first.ttclid || '',
      gclid: attr.last.gclid || '', gbraid: attr.last.gbraid || '', wbraid: attr.last.wbraid || '',
      msclkid: attr.last.msclkid || cookie('_uetmsclkid').replace(/^_uet/, ''),
      ga_client_id: ga.length >= 4 ? ga.slice(-2).join('.') : '', user_agent: (w.navigator && w.navigator.userAgent) || ''
    };
  }

  /* ---------- consentimento (Google Consent Mode v2) ---------- */
  var CONSENT_KEY = 'sf_consent';
  var consent = CFG.consent && CFG.consent.required ? (store.get(CONSENT_KEY) || { ads: false, analytics: false }) : { ads: true, analytics: true };
  w.dataLayer = w.dataLayer || [];
  var gtag = w.gtag || function () { w.dataLayer.push(arguments); };
  w.gtag = gtag;
  function consentState(c) {
    return { ad_storage: c.ads ? 'granted' : 'denied', ad_user_data: c.ads ? 'granted' : 'denied', ad_personalization: c.ads ? 'granted' : 'denied', analytics_storage: c.analytics ? 'granted' : 'denied' };
  }
  if (CFG.consent && CFG.consent.required) gtag('consent', 'default', Object.assign(consentState(consent), { wait_for_update: 500 }));

  /* ---------- carregadores (só no domínio, só com ID) ---------- */
  function script(src, attrs) {
    var s = d.createElement('script'); s.async = true; s.src = src;
    if (attrs) Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    (d.head || d.documentElement).appendChild(s); return s;
  }
  var loaded = {};
  var V = {
    ga4: function () {
      if (!has(CFG.ga4.id)) return;
      script('https://www.googletagmanager.com/gtag/js?id=' + CFG.ga4.id);
      gtag('js', new Date());
      gtag('config', CFG.ga4.id, IS_TEST ? { debug_mode: true, traffic_type: 'internal' } : {});
      loaded.ga4 = true;
    },
    googleAds: function () {
      if (!has(CFG.googleAds.id)) return;
      if (!loaded.ga4) { script('https://www.googletagmanager.com/gtag/js?id=' + CFG.googleAds.id); gtag('js', new Date()); }
      gtag('config', CFG.googleAds.id, { allow_enhanced_conversions: !!(CFG.userData && CFG.userData.enabled) });
      loaded.googleAds = true;
    },
    meta: function () {
      if (!has(CFG.meta.pixelId) || w.fbq) { if (w.fbq) loaded.meta = true; return; }
      /* eslint-disable */
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];(s?s.parentNode.insertBefore(t,s):b.head.appendChild(t))}(w,d,'script','https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
      w.fbq('init', CFG.meta.pixelId);
      w.fbq('track', 'PageView');
      loaded.meta = true;
    },
    tiktok: function () {
      if (!has(CFG.tiktok.pixelId)) return;
      /* eslint-disable */
      !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=r+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];(a?a.parentNode.insertBefore(o,a):d.head.appendChild(o))}}(w,d,'ttq');
      /* eslint-enable */
      w.ttq.load(CFG.tiktok.pixelId);
      w.ttq.page();
      loaded.tiktok = true;
    },
    microsoftUet: function () {
      if (!has(CFG.microsoftUet.tagId)) return;
      w.uetq = w.uetq || [];
      var s = script('https://bat.bing.com/bat.js');
      s.onload = function () { if (typeof w.UET !== 'function') return; try { var o = { ti: CFG.microsoftUet.tagId, enableAutoSpaTracking: true }; o.q = w.uetq; w.uetq = new w.UET(o); w.uetq.push('pageLoad'); } catch (e) {} };
      loaded.microsoftUet = true;
    },
    clarity: function () {
      if (!has(CFG.clarity.projectId)) return;
      w.clarity = w.clarity || function () { (w.clarity.q = w.clarity.q || []).push(arguments); };
      script('https://www.clarity.ms/tag/' + CFG.clarity.projectId);
      loaded.clarity = true;
    },
    linkedin: function () {
      if (!has(CFG.linkedin.partnerId)) return;
      w._linkedin_partner_id = CFG.linkedin.partnerId;
      w._linkedin_data_partner_ids = (w._linkedin_data_partner_ids || []).concat([CFG.linkedin.partnerId]);
      w.lintrk = w.lintrk || function (a, b) { w.lintrk.q.push([a, b]); }; w.lintrk.q = w.lintrk.q || [];
      script('https://snap.licdn.com/li.lms-analytics/insight.min.js');
      loaded.linkedin = true;
    },
    pinterest: function () {
      if (!has(CFG.pinterest.tagId)) return;
      w.pintrk = w.pintrk || function () { w.pintrk.queue.push(Array.prototype.slice.call(arguments)); }; w.pintrk.queue = w.pintrk.queue || []; w.pintrk.version = '3.0';
      script('https://s.pinimg.com/ct/core.js');
      w.pintrk('load', CFG.pinterest.tagId); w.pintrk('page');
      loaded.pinterest = true;
    },
    kwai: function () {
      if (!has(CFG.kwai.pixelId)) return;
      w.kwaiq = w.kwaiq || []; w.kwaiq.methods = ['page', 'track', 'instance', 'load'];
      w.kwaiq.methods.forEach(function (m) { w.kwaiq[m] = w.kwaiq[m] || function () { w.kwaiq.push([m].concat([].slice.call(arguments))); }; });
      script('https://s1.kwai.net/kos/s101/nlav11187/pixel/events.js?sdkid=' + CFG.kwai.pixelId + '&lib=kwaiq');
      w.kwaiq.load(CFG.kwai.pixelId); w.kwaiq.page();
      loaded.kwai = true;
    }
  };
  var ANALYTICS = ['ga4'], ADS = ['googleAds', 'meta', 'tiktok', 'microsoftUet', 'linkedin', 'pinterest', 'kwai'], BEHAVIOR = ['clarity'];
  function boot() {
    if (!ON_HOST) return;
    // GA4 carrega sempre: sem aceite, o Consent Mode manda pings sem cookie.
    ANALYTICS.forEach(function (k) { if (!loaded[k]) V[k](); });
    if (consent.ads) ADS.forEach(function (k) { if (!loaded[k]) V[k](); });
    if (consent.analytics) BEHAVIOR.forEach(function (k) { if (!loaded[k]) V[k](); });
  }

  /* ---------- mapa de eventos ---------- */
  // Conversões: a padrão de cada plataforma só vale para saude_estetica. Fora disso, evento personalizado com o nome canônico.
  // primary = conversão principal para lance (diagnóstico concluído com WhatsApp).
  var CONVERSIONS = {
    diagnostico_concluido: { needsWhatsapp: true, ga4: 'generate_lead', ga4p: { lead_type: 'diagnostico' }, meta: 'Lead', tiktok: 'SubmitForm', uet: 'submit_lead_form', pinterest: 'lead', kwai: 'EVENT_FORM_SUBMIT', primary: true },
    guia_liberado: { ga4: 'sign_up', ga4p: { method: 'guia' }, meta: 'CompleteRegistration', tiktok: 'CompleteRegistration', uet: 'sign_up', pinterest: 'signup', kwai: 'EVENT_COMPLETE_REGISTRATION' },
    pedido_contato: { ga4: 'pedido_contato', meta: 'Contact', tiktok: 'Contact', uet: 'contact', kwai: 'EVENT_CONTACT' },
    clique_whatsapp: { ga4: 'clique_whatsapp', meta: 'Contact', tiktok: 'Contact', uet: 'contact', kwai: 'EVENT_CONTACT' }
  };
  function clean(p) {
    var o = {};
    Object.keys(p || {}).forEach(function (k) {
      var v = p[k];
      if (v == null || v === '' || typeof v === 'object' || /^(name|nome|phone|telefone|whatsapp|email)$/i.test(k)) return;   // dado pessoal nunca vai em parâmetro de evento
      o[k] = typeof v === 'string' ? v.slice(0, 100) : v;
    });
    return o;
  }
  var sent = {};
  function track(name, params, opts) {
    params = params || {}; opts = opts || {};
    var eventId = opts.eventId || uuid();
    var key = name + ':' + eventId;
    if (sent[key]) return eventId;   // o mesmo evento nunca dispara duas vezes
    sent[key] = 1;
    var seg = params.segment_group || opts.segment || '';
    var conv = CONVERSIONS[name];
    var standard = !!conv && seg === 'saude_estetica' && (!conv.needsWhatsapp || params.has_whatsapp === true);
    var p = clean(params);
    var value = typeof params.value === 'number' && params.value > 0 ? params.value : null;
    var money = value != null ? { value: value, currency: CFG.currency } : {};
    var base = Object.assign({}, p, money, { event_id: eventId });
    try { w.dataLayer.push(Object.assign({ event: 'sf_' + name, sf_test: IS_TEST, sf_standard: standard }, base)); } catch (e) {}
    if (!ON_HOST) return eventId;

    // GA4: sempre (é análise); em teste vai com debug_mode e fica fora dos relatórios pelo filtro de tráfego interno.
    if (loaded.ga4) try { gtag('event', standard ? conv.ga4 : name, Object.assign({}, base, standard && conv.ga4p ? conv.ga4p : {}, IS_TEST ? { debug_mode: true } : {}, { send_to: CFG.ga4.id })); } catch (e) {}
    // Plataformas de anúncio: em teste não disparam (não ensinam o algoritmo). O teste delas é pelo servidor, com test_event_code.
    if (IS_TEST) return eventId;
    var custom = !!conv;   // conversões fora do público viram evento personalizado; eventos de funil só vão para GA4 e Meta (personalizado)
    try { if (loaded.meta && w.fbq) standard ? w.fbq('track', conv.meta, base, { eventID: eventId }) : w.fbq('trackCustom', name, base, { eventID: eventId }); } catch (e) {}
    if (!custom && !standard) return eventId;
    try { if (loaded.tiktok && w.ttq) w.ttq.track(standard ? conv.tiktok : name, Object.assign({}, p, money, { content_name: name }), { event_id: eventId }); } catch (e) {}
    try { if (loaded.microsoftUet && w.uetq) w.uetq.push('event', standard ? conv.uet : name, Object.assign({ event_category: standard ? 'conversao' : 'fora_publico', event_label: name }, value != null ? { revenue_value: value, currency: CFG.currency } : {})); } catch (e) {}
    if (!standard) return eventId;
    try { var label = CFG.googleAds.labels && CFG.googleAds.labels[name]; if (loaded.googleAds && has(label)) gtag('event', 'conversion', Object.assign({ send_to: CFG.googleAds.id + '/' + label, transaction_id: eventId }, money)); } catch (e) {}
    try { var li = CFG.linkedin.conversions && CFG.linkedin.conversions[name]; if (loaded.linkedin && has(li) && w.lintrk) w.lintrk('track', { conversion_id: Number(li), event_id: eventId }); } catch (e) {}
    try { if (loaded.pinterest && conv.pinterest && w.pintrk) w.pintrk('track', conv.pinterest, Object.assign({ event_id: eventId }, value != null ? { value: value, currency: CFG.currency } : {})); } catch (e) {}
    try { if (loaded.kwai && conv.kwai && w.kwaiq) w.kwaiq.instance(CFG.kwai.pixelId).track(conv.kwai, money); } catch (e) {}
    return eventId;
  }

  /* ---------- API pública ---------- */
  var api = function (name, params, opts) { return track(name, params, opts); };
  api.loaded = true;
  api.isTest = IS_TEST;
  api.onHost = ON_HOST;
  api.config = CFG;
  api.vendors = loaded;
  api.uuid = uuid;
  api.attribution = attribution;
  api.ids = ids;
  api.channel = channelOf;
  api.consent = function (c) {
    if (!c) return Object.assign({}, consent);
    consent = { ads: !!c.ads, analytics: !!c.analytics };
    store.set(CONSENT_KEY, consent);
    gtag('consent', 'update', consentState(consent));
    if (w.ttq && loaded.tiktok) try { consent.ads ? w.ttq.grantConsent() : w.ttq.revokeConsent(); } catch (e) {}
    boot();
    return Object.assign({}, consent);
  };
  w.sfTrack = api;
  boot();
  queue.forEach(function (a) { try { track.apply(null, a); } catch (e) {} });
})(window, document);
