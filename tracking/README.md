# Medição de smileflow.com.br

Uma camada só para o domínio inteiro: o app smileflow, o app smileflow-site e as páginas estáticas
(simulador) carregam o mesmo arquivo, `smileflow.com.br/_sf/track.js`. Sem GTM: tudo versionado aqui.

| Arquivo | O que é |
| --- | --- |
| `config.json` | IDs de cada plataforma. **ID vazio = a plataforma não carrega.** Tokens de servidor nunca entram aqui (ficam nas credenciais do n8n). |
| `track.src.js` | A função `sfTrack()`, os carregadores, o mapa de eventos, a origem (primeiro e último toque) e o consentimento. |
| `build.mjs` | Gera `public/_sf/track.js` (fonte + config). `--check` falha se o publicado estiver desatualizado. |
| `track.test.mjs` | Testes da lógica, com as plataformas trocadas por espiões. |
| `e2e/simulador.e2e.mjs` | Prova no Chrome: o simulador servido como smileflow.com.br, com todas as plataformas ligadas por IDs de teste. |

```sh
node tracking/build.mjs && node --test tracking/track.test.mjs
npx next start -p 3077 &  PW=<playwright-core> node tracking/e2e/simulador.e2e.mjs
```

## Como usar

```js
// nas páginas estáticas, antes do script: o stub guarda as chamadas até /_sf/track.js chegar
window.sfTrack=window.sfTrack||function(){(window.sfTrack.q=window.sfTrack.q||[]).push(arguments)};
sfTrack('diagnostico_concluido', { segment_group: 'saude_estetica', has_whatsapp: true, value: 900 }, { eventId });
```

No React: `import { sfTrack } from "@/lib/tracking"`. Mande o mesmo `eventId` ao n8n: é ele que deduplica
navegador e servidor (Meta `eventID`, TikTok `event_id`, Google Ads `transaction_id`).

- Só carrega em `smileflow.com.br` e `www.smileflow.com.br`. Fora disso (prévias, localhost) tudo é teste e nada carrega.
- `?teste=1` vale para a sessão inteira: nenhuma plataforma carrega ou recebe chamadas; só `dataLayer`
  preserva o diagnóstico (`sf_test: true`).
- Nome, telefone e e-mail nunca vão em parâmetro de evento (a camada descarta essas chaves).
- `sfTrack.attribution()` devolve o primeiro e o último toque (UTMs, `gclid`, `gbraid`, `wbraid`, `fbclid`, `ttclid`,
  `msclkid`, `li_fat_id`, referrer externo e página de entrada, por 90 dias) e o canal de cada um.
  `sfTrack.ids()` devolve `fbp`, `fbc`, `ttp`, `ga_client_id` e os click IDs para o servidor.
- Consentimento: com `consent.required = true`, o GA4 roda sem cookie (Consent Mode v2) até o aceite;
  pixels de anúncio e Clarity só carregam depois de `sfTrack.consent({ ads: true, analytics: true })`.

## Mapa de eventos

Conversão padrão só para `segment_group = saude_estetica`. Qualquer outro público (ou sem área) vira evento
personalizado com o nome canônico em todas as plataformas, e nunca conversão do Google Ads, LinkedIn, Pinterest ou Kwai.
Assim os anúncios não aprendem a buscar o público errado.

| Evento (`sfTrack`) | Papel no lance | GA4 | Meta | TikTok | Google Ads | Microsoft UET |
| --- | --- | --- | --- | --- | --- | --- |
| `diagnostico_concluido` com `has_whatsapp: true` | **Principal** | `generate_lead` (`lead_type=diagnostico`, `value`) | `Lead` | `SubmitForm` | label `diagnostico_concluido` | `submit_lead_form` |
| `guia_liberado` | Secundária | `sign_up` (`method=guia`) | `CompleteRegistration` | `CompleteRegistration` | label `guia_liberado` | `sign_up` |
| `pedido_contato` | Secundária | `pedido_contato` | `Contact` | `Contact` | label `pedido_contato` | `contact` |
| `clique_whatsapp` | Secundária | `clique_whatsapp` | `Lead` | `Contact` | label `clique_whatsapp` | `contact` |
| `diagnostico_concluido` sem WhatsApp | Funil | `diagnostico_concluido` | personalizado | personalizado | — | personalizado |
| `lista_espera` (fora da saúde) | Funil | `lista_espera` | personalizado | personalizado | — | personalizado |
| Funil: `perfil_preenchido`, `simulacao_iniciada`, `resultado_simulacao`, `pedido_whatsapp_visto`, `guia_aberto`, `flashcards_iniciados`, `cartoes_concluidos`, `diagnostico_iniciado`, `lp_view`… | — | mesmo nome | personalizado | — | — | — |

No simulador MNC, `clique_whatsapp` continua com esse nome no GA4; todo clique envia `Lead` à Meta,
com `lead_type=whatsapp_vsl` ou `whatsapp_simulador`, mesmo sem área selecionada. Vídeos VSL audíveis
enviam `video_start`, `video_progress` (25/50/75) e `video_complete` ao GA4, e `vsl_play`,
`vsl_25`, `vsl_50`, `vsl_75` e `vsl_100` como eventos personalizados da Meta.

LinkedIn (`conversions[evento]`), Pinterest (`lead`, `signup`) e Kwai (`EVENT_FORM_SUBMIT`, `EVENT_COMPLETE_REGISTRATION`,
`EVENT_CONTACT`) seguem a mesma regra, só quando o ID estiver preenchido.
