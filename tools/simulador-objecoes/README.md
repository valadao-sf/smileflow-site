# Simulador de objeções (Treinos da Nath)

Fonte das páginas publicadas em `smileflow.com.br/simulador-objecoes`. Tudo sai de um único arquivo,
`engine.html`: o mesmo motor roda no artefato "Treinos da Nath" e no site.

Não edite `public/simulador-objecoes/*.html` à mão: esses arquivos são gerados.

## Arquivos

| Arquivo | O que é |
| --- | --- |
| `engine.html` | O motor: telas, conteúdo das 6 objeções, diagnóstico, lista de espera, eventos. A configuração fica no objeto `CONFIG`, no começo do script. |
| `build.py` | Gera as 7 páginas (`index` = tela inicial e uma por objeção) em `public/simulador-objecoes/`, com título, descrição, dados estruturados, imagem de compartilhamento, GA4 e pixel. Depois abre cada página num navegador e grava no HTML a primeira tela já montada. Precisa de Playwright com Chromium. |
| `render_guides.py` | Gera de novo a imagem do guia de cada objeção (`guia1-*`: `.webp`, `-sm.webp` e o `.jpg` do botão Baixar) quando o texto dele muda. |
| `fonts.py` | Gera de novo a Inter de `assets/fonts` (só os caracteres do motor, pesos 400 a 800, tamanho óptico). Rode quando o texto ganhar um caractere novo. |
| `render_og.py` | Gera de novo as imagens de compartilhamento (`og-*.jpg`) com a Inter e a abertura de cada objeção. |
| `mitos.html` | Guia de mitos e verdades dos antigos cartões de treino. Saiu do funil em out/2026; fica só como referência. |

## Editar e publicar

```sh
# 1. edite tools/simulador-objecoes/engine.html
python3 tools/simulador-objecoes/build.py   # precisa de Playwright com Chromium
# 2. só se mudou texto de guia:
python3 tools/simulador-objecoes/render_guides.py
# 3. confira localmente: python3 -m http.server -d public 8000 → http://localhost:8000/simulador-objecoes/ta-caro.html?teste=1
```

`?teste=1` marca todos os eventos como teste: o n8n guarda, mas não avisa a equipe.

## Tipografia

- Só Inter, hospedada em `assets/fonts` (sem Google Fonts): uns 45 KB por estilo, com pré-carregamento do normal. O itálico só baixa quando aparece.
- Tamanho óptico automático: nos títulos grandes a Inter usa o desenho Display.
- Espaçamento de letras pela fórmula do autor da fonte: −0,011em no texto, −0,019em perto de 24px, −0,022em a partir de 32px.
- Pesos: 400 texto, 500 leve destaque, 600 subtítulos e botões, 700 títulos e a frase da objeção nos cartões, 800 o título da tela da objeção.
- Destaque por cor, não por itálico. Itálico só em fala (pacientes, Nath) e depoimentos.
- Mudou texto de guia: `render_guides.py`. Mudou abertura de objeção: `render_og.py`.

## Cores e botões

- Paleta da marca: ameixa no fundo (`--ink`, `--stage`, `--plum`), papel (`--paper`) e rosa nos destaques de texto (`--wine-hi`). O vinho (`--wine`) fica nos detalhes: balões, selo e orçamento. Não entra em botão.
- Um botão cheio por tela, em papel (`.btn-main`), só na ação principal. O resto é contorno (`.btn-ghost`, `.follow`, `.dl`) com a borda `--edge`, ou link de texto (`.link`). Os cartões usam `--line`.
- Cor nova vira token no `:root`. Nada de cor solta no CSS.
- Alvos de toque de 44 px. Link e pílula pequena ganham uma área invisível (`::after`) em vez de crescer no desenho.
- Resultado e resultado do diagnóstico: quando o botão principal está fora da tela, uma cópia dele fica presa no rodapé (`dock()`). A cópia não tem `data-*` e só repassa o clique, então o evento conta uma vez.

## Tamanhos de tela

- Abaixo de 600 px: celular, coluna de até 480 px.
- De 600 a 899 px com pelo menos 700 px de altura (tablet em pé): coluna de 600 px. Foto, vídeo e Instagram num quadro 9:16 calculado pela altura, sobre a própria foto desfocada.
- 900 px ou mais (tablet deitado e computador): colunas de 640 px (leitura e formulário) e 960 px (início, objeção, guia, tela final e resultado do diagnóstico). O quadro 9:16 também é calculado pela altura. Botões com a largura do texto, mínimo de 280 px; em formulário e em grade, a largura toda.
- A partir de 1100 px com a tela deitada, a conversa fica em dois painéis: a foto inteira à esquerda e a conversa à direita.
- Fotos grandes: `p*.webp` (720×1280). As miniaturas `s*.webp` (240×427) entram por `srcset` onde a foto é pequena.

## Como o funil funciona

- Cada objeção tem um exercício, a simulação com 4 pessoas, e um guia. Os cartões de treino (certo ou errado) e o segundo guia saíram em out/2026; links antigos com `?ex=flash` abrem a simulação.
- Não existe mais a tela "Meus guias": o guia liberado aparece no cartão da objeção, na tela inicial e na tela da objeção, com o botão "Baixar o guia" (`assets/guia1-<id>.jpg`).
- A tela inicial é a mesma para todo mundo: o título, o elenco (as 24 pessoas das simulações, subindo devagar; parado com movimento reduzido), as objeções e, depois delas, o cartão "Além das objeções", que leva ao vídeo da Nath. Não há diagnóstico, bio nem rodapé na tela inicial.
- Quem já tem perfil vê o nome só no subtítulo ("Ana, qual frase mais trava você?"). O nome abre o formulário com as respostas de antes, para corrigir; no formulário, "Não é você? Começar do zero" apaga do navegador o perfil, os guias, o diagnóstico e a lista de espera (fica o grupo do teste A/B, a origem da visita e a fila de envios).
- Os cartões das objeções têm só a frase, grande, e o estado ("Simulação · 3 min" ou "Guia liberado" com o botão de baixar). Os rostos ficam no elenco do topo e na simulação.
- A tela final termina com o link "Voltar ao início". O resultado do diagnóstico termina com um link só: "Continuar" quando a pessoa veio de uma objeção, "Voltar ao início" quando veio da tela inicial.
- No pedido do guia, o topo do guia aparece nítido e some num degradê. É o mesmo trecho que a prévia do guia já mostra.
- Nomes fixos nos textos: "simulação" (as 4 conversas), "diagnóstico" (as 7 perguntas), "guia", "Método Negociação Clínica (MNC)" por extenso na primeira vez em cada tela. O mesmo botão tem o mesmo nome em todas as telas ("Começar a simulação", "Ver onde minha venda escapa", "Enviar no WhatsApp", "Baixar o guia").

## Busca e assistentes de IA

- Robôs que não rodam JavaScript (os do ChatGPT, do Claude e do Perplexity) leem só o HTML. Por isso o `build.py` grava em cada página a primeira tela já montada: a tela inicial no `index` e a tela da objeção nas outras. Cada página tem o seu próprio texto.
- Título e H1 seguem a pergunta que se digita no Google: "O que responder quando o paciente diz “tá caro”?". O verbo fica em `OBJECTIONS[id].ask`; `q` troca a pergunta inteira quando a busca é outra (no desconto, "pede desconto"). Fora da saúde, depois do perfil, a tela diz "o cliente".
- Logo abaixo do H1 vem a resposta em uma frase (`OBJECTIONS[id].answer`) e só depois o convite para a simulação: é a frase que busca e IA citam. A descrição de busca usa `snippet`, a versão curta da mesma resposta (o `build.py` barra descrição com mais de 155 caracteres). As duas saem da `rule`; não invente nada que não esteja nela.
- Na tela da objeção, a explicação aparece aberta, no formato da conversa da simulação: a foto da Nath, o título `rule.head` e os parágrafos `rule.text`, com o link dos destaques do Instagram no fim. `rule.text` é o mesmo texto do `FAQPage` nos dados estruturados: mudou um, o `build.py` atualiza o outro.
- O texto aberto é só a explicação. As perguntas para usar na conversa continuam no guia em imagem, que a simulação libera.
- Tom dos textos (explicação, guia, explicação depois de cada resposta, resultado e perfis): objetivo. O que a resposta fez, o efeito na pessoa e o que fazer. Sem frase de efeito, bordão de uma palavra ("Pare.", "Acolha."), "Segure essa vontade" ou fecho de impacto. As falas da Nath nos roteiros dos vídeos ficam como ela fala.
- Para conferir, extraia o texto sem JavaScript das 7 páginas: nenhuma pode repetir o texto de outra objeção.

## O que preencher em `CONFIG`

| Campo | Para quê | Enquanto vazio |
| --- | --- | --- |
| `privacyUrl` | Link "Como usamos os seus dados" nos 3 formulários com WhatsApp | O link não aparece |
| `proof` | Até 3 depoimentos reais: `{ quote, name, detail }` | O bloco não aparece |
| `mnc.about` | Até 3 linhas sobre o MNC (formato, duração, para quem) | O bloco não aparece |
| `objHighlight` | Link do destaque "Objeções" no Instagram da Nath | Os botões abrem o perfil |
| `mnc.vsl` | Quando o recado da Nath for gravado, trocar `{ photo, script }` por `{ id, mp4, poster }` | Mostra foto com legenda |
| `ab.vsl` | % de pessoas que veem o recado antes do WhatsApp (hoje 50) | 0 = ninguém |

Os vídeos de cada objeção ficam em `OBJECTIONS[id].videos.v1/v2`. Sem `id` do Panda, o motor mostra o roteiro em legenda.

- `id` é o id do player do Panda (o `v=` do embed), não o `video_id` da API. O HLS sai de `CONFIG.pandaHls + id + '/playlist.m3u8'`.
- Com vídeo: `{ id, poster, title, fallback: { photo, script } }`. O roteiro fica como legenda sobre o pôster para quando o vídeo não carregar. Só o “tá caro” tem `mp4` local (para o artefato); sem `mp4`, o artefato mostra a legenda.
- Gravados (21/out/2026): todos os V1 e V2, menos o V2 do “vou pensar”, que continua com foto e legenda. O recado do diagnóstico (`CONFIG.mnc.vsl`) também está gravado, mas o teste que o mostra (`CONFIG.ab.vsl`) está desligado (0) até o site ter tráfego: todo mundo vai do resultado direto para o WhatsApp. Com 0 (ou 100), ninguém fica com grupo salvo no navegador; com um valor entre os dois, o grupo é sorteado uma vez e guardado em `nath_ab`. `?ab=B` mostra o recado para conferir.
- Pôsteres: `assets/<objeção>-v1-poster.webp` e `-v2-`, um quadro do começo de cada vídeo (540×952).

## Dados

- Eventos vão para `https://n8n.smileflow.me/webhook/simulador-objecoes` (workflow em `automation-ops/workflows/simulador-objecoes`).
- `form_id: simulador_objecoes_v1`, `form_version: 1.3.1`. Ao mudar pergunta ou texto de aceite, suba a versão para manter o vínculo entre envio, versão e consentimento.
- Campos de triagem em todo evento: `business` (a grande área: `saude_estetica` | `servicos` | `comercio` | `outro`; perfis antigos com `odonto`, `estetica`, `fono` ou `saude` viram `saude_estetica`), `segment_group` (`saude_estetica` para saúde e estética, `fora_saude` para o resto), `business_label`, `business_other` (o que a pessoa escreveu em "Com o que você trabalha?", sempre preenchido, até 120 caracteres), `role_label`.
- Na saúde, o texto livre escolhe os exemplos da simulação (odontologia, estética ou fono, em `inferArea`). Nas outras áreas, os exemplos são de odontologia.
- Quem não é de `saude_estetica` vai para a lista de espera e não dispara Lead/Contact no Meta.
