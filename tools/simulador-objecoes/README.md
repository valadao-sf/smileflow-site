# Simulador de objeções (Treinos da Nath)

Fonte das páginas publicadas em `smileflow.com.br/simulador-objecoes`. Tudo sai de um único arquivo,
`engine.html`: o mesmo motor roda no artefato "Treinos da Nath" e no site.

Não edite `public/simulador-objecoes/*.html` à mão: esses arquivos são gerados.

## Arquivos

| Arquivo | O que é |
| --- | --- |
| `engine.html` | O motor: telas, conteúdo das 6 objeções, próximo passo (WhatsApp ou lista de espera), eventos. A configuração fica no objeto `CONFIG`, no começo do script. |
| `build.py` | Gera as 7 páginas (`index` = tela inicial e uma por objeção) em `public/simulador-objecoes/`, com título, descrição, dados estruturados, imagem de compartilhamento, GA4 e pixel. Depois abre cada página num navegador e grava no HTML a primeira tela já montada. Precisa de Playwright com Chromium. |
| `render_guides.py` | Gera de novo a imagem do guia de cada objeção (`guia1-*`: `.webp`, `-sm.webp` e o `.jpg` do botão Baixar) quando o texto dele muda. |
| `fonts.py` | Gera de novo a Inter de `assets/fonts` (só os caracteres do motor, pesos 400 a 800, tamanho óptico). Rode quando o texto ganhar um caractere novo. |
| `render_og.py` | Gera as imagens de compartilhamento com o rosto da Nath: `share-<id>.jpg` (1200×630) e `share-<id>-sq.jpg` (1200×1200), abaixo de 300 KB (limite do WhatsApp). |
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
- Mudou texto de guia: `render_guides.py`. Mudou a frase de uma objeção ou a foto da Nath: `render_og.py`. As páginas usam `https://www.smileflow.com.br` no canônico, no og:url e no link de compartilhar.

## Cores e botões

- Paleta da marca: ameixa no fundo (`--ink`, `--stage`, `--plum`), papel (`--paper`) e rosa nos destaques de texto (`--wine-hi`). O vinho (`--wine`) fica nos detalhes: balões, selo e orçamento. Não entra em botão.
- Um botão cheio por tela, em papel (`.btn-main`), só na ação principal. O resto é contorno (`.btn-ghost`, `.follow`, `.dl`) com a borda `--edge`, ou link de texto (`.link`). Os cartões usam `--line`.
- Cor nova vira token no `:root`. Nada de cor solta no CSS.
- Alvos de toque de 44 px. Link e pílula pequena ganham uma área invisível (`::after`) em vez de crescer no desenho.
- Resultado da simulação: quando o botão principal está fora da tela, uma cópia dele fica presa no rodapé (`dock()`). A cópia não tem `data-*` e só repassa o clique, então o evento conta uma vez.

## Tamanhos de tela

- Abaixo de 600 px: celular, coluna de até 480 px.
- De 600 a 899 px com pelo menos 700 px de altura (tablet em pé): coluna de 600 px. Foto, vídeo e Instagram num quadro 9:16 calculado pela altura, sobre a própria foto desfocada.
- 900 px ou mais (tablet deitado e computador): colunas de 640 px (leitura e formulário) e 960 px (início, objeção, guia e tela final). O quadro 9:16 também é calculado pela altura. Botões com a largura do texto, mínimo de 280 px; em formulário e em grade, a largura toda.
- A partir de 1100 px com a tela deitada, a conversa fica em dois painéis: a foto inteira à esquerda e a conversa à direita.
- Fotos grandes: `p*.webp` (720×1280). As miniaturas `s*.webp` (240×427) entram por `srcset` onde a foto é pequena.

## Como o funil funciona

- Cada objeção tem um exercício, a simulação com 4 pessoas, e um guia. Os cartões de treino (certo ou errado) e o segundo guia saíram em out/2026; links antigos com `?ex=flash` abrem a simulação.
- Não existe mais a tela "Meus guias": o guia liberado aparece no cartão da objeção, na tela inicial e na tela da objeção, com o botão "Baixar o guia" (`assets/guia1-<id>.jpg`).
- A tela inicial é a mesma para todo mundo: o título, o elenco (as 24 pessoas das simulações, subindo devagar; parado com movimento reduzido), a chamada do funil do VSL logo abaixo do texto de abertura (no celular, dentro da primeira tela) e as objeções. Não há diagnóstico, bio nem rodapé na tela inicial. Fora da saúde, a chamada não aparece.
- Quem já tem perfil vê o nome só no subtítulo ("Ana, qual frase mais trava você?"). O nome abre o formulário com as respostas de antes, para corrigir; no formulário, "Não é você? Começar do zero" apaga do navegador o perfil, os guias e a lista de espera (fica o grupo do teste A/B, a origem da visita e a fila de envios).
- Os cartões das objeções têm só a frase, grande, e o estado ("Simulação · 3 min" ou "Guia liberado" com o botão de baixar). Os rostos ficam no elenco do topo e na simulação.
- A tela final termina com o link "Voltar ao início".
- Funil do VSL (out/2026): a chamada "Descubra por que você trava na hora do preço." fica na tela inicial, no guia liberado (acima da imagem do guia) e na tela final. São 5 telas, uma por vez: o que a pessoa faz no "tá caro", quem ensinou a vender, o que mais incomoda, a resposta aberta ("Eu conseguiria...") e a revelação. O botão leva ao VSL da Nath (5:20, Panda `754d121e…`, em `CONFIG.funil.video`). O vídeo é deitado: no celular vai de borda a borda, do topo até a Nath e o botão, num recorte que deixa a legenda inteira (35% da largura do vídeo, medido nos quadros do VSL); no computador, inteiro em 16:9. Nada rola. O botão do WhatsApp aparece já na entrada da tela (`CONFIG.funil.ctaAt: 0`), para quem se convencer cedo; com um número de segundos, ele espera esse ponto do vídeo (ou o fim, ou a falha do vídeo). A chamada usa o cartão padrão da Nath (rosto na bolinha, nome e @). As 5 telas mostram a Nath perguntando, com as opções entrando uma a uma e a tela deslizando para a próxima; a revelação tem a Nath na tela inteira (`assets/nath-vsl*.webp`). Por enquanto as mensagens vão para o WhatsApp da Nathálya (`CONFIG.whatsapp`). A mensagem do WhatsApp leva as respostas na primeira pessoa; o envio ao n8n é o mesmo clique no WhatsApp (`where: funil`), sem as respostas. Depois que a pessoa chega ao vídeo, o guia e a tela final voltam a mostrar o cartão do WhatsApp. Eventos: `funil_iniciado`, `funil_resposta` (pergunta:resposta), `funil_video`, `funil_botao_whatsapp`.
- Próximo passo (desde 21/out/2026 não há diagnóstico no fim do funil): no guia e na tela final, depois do funil, o cartão "Fale com a equipe da Nath" abre o WhatsApp da equipe com a mensagem pronta (nome, área, função e quantas conversas da simulação a pessoa acertou) e tem "Prefiro que a equipe me chame". Fora da saúde, no lugar dele aparece a lista de espera.
- No pedido do guia, o topo do guia aparece nítido e some num degradê. É o mesmo trecho que a prévia do guia já mostra.
- Nomes fixos nos textos: "simulação" (as 4 conversas), "guia", "Método Negociação Clínica (MNC)" por extenso na primeira vez em cada tela. O mesmo botão tem o mesmo nome em todas as telas ("Começar a simulação", "Falar no WhatsApp", "Baixar o guia").

## Busca e assistentes de IA

- Robôs que não rodam JavaScript (os do ChatGPT, do Claude e do Perplexity) leem só o HTML. Por isso o `build.py` grava em cada página a primeira tela já montada: a tela inicial no `index` e a tela da objeção nas outras. Cada página tem o seu próprio texto.
- Título e H1 seguem a pergunta que se digita no Google: "O que responder quando o paciente diz “tá caro”?". O verbo fica em `OBJECTIONS[id].ask`; `q` troca a pergunta inteira quando a busca é outra (no desconto, "pede desconto"). Fora da saúde, depois do perfil, a tela diz "o cliente".
- Logo abaixo do H1 vem a resposta em uma frase (`OBJECTIONS[id].answer`) e só depois o convite para a simulação: é a frase que busca e IA citam. A descrição de busca usa `snippet`, a versão curta da mesma resposta (o `build.py` barra descrição com mais de 155 caracteres). As duas saem da `rule`; não invente nada que não esteja nela.
- Na tela da objeção, a explicação aparece aberta, no formato da conversa da simulação: a foto da Nath, o título `rule.head` e os parágrafos `rule.text`, com o link dos destaques do Instagram no fim. `rule.text` é o mesmo texto do `FAQPage` nos dados estruturados: mudou um, o `build.py` atualiza o outro.
- Abaixo dela, a seção das conversas (`aeoBlock`), toda montada a partir dos dados da objeção, sem texto novo: o passo a passo do guia (`gift.text`), uma pergunta por conversa (fala do paciente → resposta certa, motivo do `card`, o que trava pelas opções erradas, o caso em cada área do `ctx`) e o roteiro do vídeo 2. Fica em `<details>` fechado para não estragar a simulação, mas vai no HTML montado. As mesmas perguntas (`aeoFaq`) viram o `FAQPage`; o vídeo 2 vira `VideoObject` com a transcrição; `datePublished`/`dateModified` e o "Atualizado em" saem do build.
- O guia, na tela da objeção, é uma linha de bônus abaixo do botão (`exBonus`). O botão da simulação é o destaque.
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
| `ab.vsl` | Sem uso desde que o diagnóstico saiu (o recado aparecia no resultado dele) | 0 = ninguém |

Os vídeos de cada objeção ficam em `OBJECTIONS[id].videos.v1/v2`. Sem `id` do Panda, o motor mostra o roteiro em legenda.

- `id` é o id do player do Panda (o `v=` do embed), não o `video_id` da API. O HLS sai de `CONFIG.pandaHls + id + '/playlist.m3u8'`.
- Com vídeo: `{ id, poster, title, fallback: { photo, script } }`. O roteiro fica como legenda sobre o pôster para quando o vídeo não carregar. Só o “tá caro” tem `mp4` local (para o artefato); sem `mp4`, o artefato mostra a legenda.
- Gravados: todos os V1 e V2 (o V2 do “vou pensar”, `5e6c20eb…`, entrou em 26/out/2026). O recado do diagnóstico (`CONFIG.mnc.vsl`) também está gravado, mas fala do diagnóstico antigo ("em qual parte a sua venda escapa"), que saiu do funil em 21/out/2026; a tela `vsl` ficou sem entrada. O teste `CONFIG.ab.vsl` está em 0: com 0 (ou 100), ninguém fica com grupo salvo no navegador.
- Pôsteres: `assets/<objeção>-v1-poster.webp` e `-v2-`, um quadro do começo de cada vídeo (540×952).

## Dados

- Eventos vão para `https://n8n.smileflow.me/webhook/simulador-objecoes` (workflow em `automation-ops/workflows/simulador-objecoes`).
- `form_id: simulador_objecoes_v1`, `form_version: 1.4.0` (1.4.0: sem diagnóstico; os envios são guia, clique no WhatsApp, pedido de contato e lista de espera). Ao mudar pergunta ou texto de aceite, suba a versão para manter o vínculo entre envio, versão e consentimento.
- Campos de triagem em todo evento: `business` (a grande área: `saude_estetica` | `servicos` | `comercio` | `outro`; perfis antigos com `odonto`, `estetica`, `fono` ou `saude` viram `saude_estetica`), `segment_group` (`saude_estetica` para saúde e estética, `fora_saude` para o resto), `business_label`, `business_other` (o que a pessoa escreveu em "Com o que você trabalha?", sempre preenchido, até 120 caracteres), `role_label`.
- Na saúde, o texto livre escolhe os exemplos da simulação (odontologia, estética ou fono, em `inferArea`). Nas outras áreas, os exemplos são de odontologia.
- Quem não é de `saude_estetica` vai para a lista de espera e não dispara Lead/Contact no Meta.

## Mudanças de 28/out/2026

- Simulação com 2 conversas (`SIM_N`): clicou na objeção (na tela inicial, no fim ou em "Treine outra"), abre direto o vídeo 1 → 1ª pessoa → vídeo 2 → 2ª pessoa → tela final. Sem perfil, guia, funil ou WhatsApp no caminho. As 4 conversas de cada objeção continuam no texto da página (AEO).
- Guia único: `assets/guia-de-objecoes-nathalya-mello.pdf` (capa + os 6 guias + contracapa), gerado por `render_guides.py`. Vai pelo Instagram da Nath: o cartão da tela inicial e da tela final abre `CONFIG.igDm` e pede a palavra `CONFIG.guideWord` ("GUIA"); a automação do Instagram responde com o PDF.
- Tela inicial: fundo roxo escuro com degradê leve, sem as fotos. Tela final: o resumo da objeção, o cartão do guia e "E se a próxima pessoa disser…?" com as outras objeções.
- O funil do vídeo da Nath saiu do simulador e virou a página `/perfil-de-negociacao` (o mesmo motor com `standalone: true` e `start: 'fn'`), para tráfego pago: intro → nome, WhatsApp e aceite → área → função → as 4 perguntas → revelação ("Quero entender meu perfil") → vídeo e WhatsApp. O contato vai uma vez ao n8n quando os dados ficam completos: `type: perfil`, `form_id: perfil_negociacao_v1`, `form_version: 1.0.0`, aceite em `PERFIL_CONSENT`. Mudou pergunta ou aceite, suba a versão.
- A contracapa do PDF chama para o perfil de negociação, com link clicável (UTM `utm_source=guia&utm_medium=pdf`).
