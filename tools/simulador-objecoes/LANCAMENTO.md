# Missão: lançar a V1 do Simulador de objeções

Objetivo: `smileflow.com.br/simulador-objecoes` no ar, com cada contato chegando no Supabase, em Submissões (Notion) e no #forms-leads (Discord).

Pronto quando: um evento de teste enviado da página em produção aparece em `webhook_events_raw`, e um contato real de teste (marcado como teste no nome) aparece em Submissões e no Discord.

## Estado em 20/10/2026

Os 3 PRs estão com as checagens passando, sem conflito e sem nada mesclado.

| PR | O que faz | Estado |
| --- | --- | --- |
| [smileflow-site#47](https://github.com/valadao-sf/smileflow-site/pull/47) | As 7 páginas em `public/simulador-objecoes` + esta pasta `tools/simulador-objecoes` | Aberto |
| [smileflow#3052](https://github.com/valadao-sf/smileflow/pull/3052) | `src/proxy.ts` encaminha `/simulador-objecoes` para o deploy do smileflow-site | Rascunho |
| [automation-ops#249](https://github.com/valadao-sf/automation-ops/pull/249) | Workflow n8n em `workflows/simulador-objecoes` | Rascunho |

Prévia do site: https://smileflow-marketing-git-feat-simula-fc33fb-valadao-sfs-projects.vercel.app/simulador-objecoes/ta-caro

Hoje `POST https://n8n.smileflow.me/webhook/simulador-objecoes` responde 404: o workflow ainda não existe no n8n.

## Passos

1. **Importar o workflow no n8n** (`n8n.smileflow.me`).
   - Arquivo: `automation-ops/workflows/simulador-objecoes/exports/simulador-objecoes.json`. Para gerar de novo: `node workflows/simulador-objecoes/build-export.mjs`.
   - Nome: "SmileFlow | Simulador de objeções — contatos e diagnóstico".
   - Credenciais já referenciadas: Supabase `22xATxgaEFw8Hfon` (node 03) e Discord bot token `RNqrpGLjiYHRsr36` (node 06, canal #forms-leads `1500494847881248959`). O node 05 usa a variável de ambiente `NOTION_TOKEN` do n8n e o banco Submissões `075d7e34-41f7-4713-8b72-a746ba976c22`.
   - Testes do normalizador: `node --test workflows/simulador-objecoes/normalize.test.mjs` (8 passando).
2. **Testar sem avisar ninguém.** Antes de ativar, use a URL de teste do webhook. Depois, ative e repita.
   - Envie um POST `text/plain` com JSON `{"event_id":"<uuid>","type":"guia","form_id":"simulador_objecoes_v1","form_version":"1.1.0","is_test":true,"name":"Teste Simulador","objection":"ta-caro"}`.
   - Esperado: resposta 200, uma linha em `webhook_events_raw` com `provider = simulador-objecoes` e `status = test`, e nenhuma página em Submissões nem mensagem no Discord.
   - Repita com o mesmo `event_id`: não pode duplicar a linha (`on_conflict provider,provider_message_id`).
3. **Pedir o ok do Halyson e ativar o workflow.**
4. **Pedir o ok do Halyson para publicar** e mesclar nesta ordem:
   1. automation-ops#249;
   2. smileflow-site#47;
   3. smileflow#3052, que é o que põe a página no ar em smileflow.com.br.
5. **Conferir em produção:**
   - `/simulador-objecoes` e as 6 páginas de objeção abrem, com título e imagem de compartilhamento (`og-*.jpg`) certos.
   - GA4 `G-ZC4Y4L1YQN` e pixel `888486630406077` só carregam em smileflow.com.br.
   - Com `?teste=1`, faça uma simulação inteira e libere um guia com WhatsApp. O evento deve chegar no Supabase como `test`.
   - Um contato real de teste (nome "Teste Simulador", origem smileflow.com.br, sem `?teste=1`) deve chegar em Submissões e no Discord, com a mensagem sugerida. Depois, apagar a página de teste em Submissões.
6. **Avisar o Halyson** com o que foi testado e os links.

## Cuidados

- PII, publicação em produção e acesso privilegiado: perguntar antes. Não usar dados reais de visitantes em testes, prints ou prompts.
- Não editar `public/simulador-objecoes/*.html` à mão: editar `engine.html` e rodar `build.py` (veja o README).
- Ao mudar pergunta ou texto de aceite, subir `form_version` no motor.

## Depende da equipe (não trava o lançamento técnico)

- Página de privacidade → `CONFIG.privacyUrl`. Recomendado ter antes de pôr verba em anúncio.
- 2 ou 3 depoimentos reais → `CONFIG.proof`.
- 3 linhas sobre o MNC → `CONFIG.mnc.about`.
- Link do destaque "Objeções" → `CONFIG.objHighlight`.
- Gravações dos vídeos 1 e 2 de 5 objeções e do recado da Nath (doc "Roteiros para a Nath gravar"). Na V1, só o "tá caro" tem os dois vídeos gravados: começar os anúncios por ele.
- Como a equipe responde os contatos: doc "Como responder os contatos do simulador".
