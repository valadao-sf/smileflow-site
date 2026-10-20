# Simulador de objeções (Treinos da Nath)

Fonte das páginas publicadas em `smileflow.com.br/simulador-objecoes`. Tudo sai de um único arquivo,
`engine.html`: o mesmo motor roda no artefato "Treinos da Nath" e no site.

Não edite `public/simulador-objecoes/*.html` à mão: esses arquivos são gerados.

## Arquivos

| Arquivo | O que é |
| --- | --- |
| `engine.html` | O motor: telas, conteúdo das 6 objeções, diagnóstico, lista de espera, eventos. A configuração fica no objeto `CONFIG`, no começo do script. |
| `build.py` | Gera as 7 páginas (`index` = tela inicial e uma por objeção) em `public/simulador-objecoes/`, com título, descrição, dados estruturados, imagem de compartilhamento, GA4 e pixel. Depois abre cada página num navegador e grava no HTML a primeira tela já montada. Precisa de Playwright com Chromium. |
| `render_guides.py` | Gera de novo as imagens dos guias (`guia1-*` e `mitos-*`, com as versões `-sm`) quando o texto deles muda. |
| `mitos.html` | Texto e desenho do Guia 2 (mitos e verdades) de cada objeção. |

## Editar e publicar

```sh
# 1. edite tools/simulador-objecoes/engine.html (ou mitos.html)
python3 tools/simulador-objecoes/build.py   # precisa de Playwright com Chromium
# 2. só se mudou texto de guia:
python3 tools/simulador-objecoes/render_guides.py
# 3. confira localmente: python3 -m http.server -d public 8000 → http://localhost:8000/simulador-objecoes/ta-caro.html?teste=1
```

`?teste=1` marca todos os eventos como teste: o n8n guarda, mas não avisa a equipe.

## Busca e assistentes de IA

- Robôs que não rodam JavaScript (os do ChatGPT, do Claude e do Perplexity) leem só o HTML. Por isso o `build.py` grava em cada página a primeira tela já montada: a tela inicial no `index` e a tela da objeção nas outras. Cada página tem o seu próprio texto.
- Título e H1 seguem a pergunta que se digita no Google: "O que responder quando o paciente diz “tá caro”". O verbo fica em `OBJECTIONS[id].ask`; `q` troca a pergunta inteira quando a busca é outra (no desconto, "pede desconto"). Fora da saúde, depois do perfil, a tela diz "o cliente".
- "Resposta curta", na tela da objeção, mostra a `rule` da objeção. É o mesmo texto do `FAQPage` nos dados estruturados: mudou um, o `build.py` atualiza o outro.
- O texto aberto é só a regra. As perguntas para usar na conversa continuam no guia em imagem, que a simulação libera.
- Para conferir, extraia o texto sem JavaScript das 7 páginas: nenhuma pode repetir o texto de outra objeção.

## O que preencher em `CONFIG`

| Campo | Para quê | Enquanto vazio |
| --- | --- | --- |
| `privacyUrl` | Link "Como usamos os seus dados" nos 3 formulários com WhatsApp | O link não aparece |
| `proof` | Até 3 depoimentos reais: `{ quote, name, detail }` | O bloco não aparece |
| `mnc.about` | Até 3 linhas sobre o MNC (formato, duração, para quem) | O bloco não aparece |
| `objHighlight` | Link do destaque "Objeções" no Instagram da Nath | Os botões abrem o perfil |
| `mnc.vsl` | Quando o recado da Nath for gravado, trocar `{ photo, script }` por `{ id, mp4, poster }` | Mostra foto com legenda |
| `ab.vsl` | % de pessoas que veem o recado antes do WhatsApp | 0 = ninguém |

Os vídeos de cada objeção ficam em `OBJECTIONS[id].videos.v1/v2`. Sem `id` do Panda, o motor mostra o roteiro em legenda.

## Dados

- Eventos vão para `https://n8n.smileflow.me/webhook/simulador-objecoes` (workflow em `automation-ops/workflows/simulador-objecoes`).
- `form_id: simulador_objecoes_v1`, `form_version: 1.2.0`. Ao mudar pergunta ou texto de aceite, suba a versão para manter o vínculo entre envio, versão e consentimento.
- Campos de triagem em todo evento: `business` (a grande área: `saude_estetica` | `servicos` | `comercio` | `outro`; perfis antigos com `odonto`, `estetica`, `fono` ou `saude` viram `saude_estetica`), `segment_group` (`saude_estetica` para saúde e estética, `fora_saude` para o resto), `business_label`, `business_other` (o que a pessoa escreveu em "O que você faz?", sempre preenchido, até 120 caracteres), `role_label`.
- Na saúde, o texto livre escolhe os exemplos do teste (odontologia, estética ou fono, em `inferArea`). Nas outras áreas, os exemplos são de odontologia.
- Quem não é de `saude_estetica` vai para a lista de espera e não dispara Lead/Contact no Meta.
