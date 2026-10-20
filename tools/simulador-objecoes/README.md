# Simulador de objeções (Treinos da Nath)

Fonte das páginas publicadas em `smileflow.com.br/simulador-objecoes`. Tudo sai de um único arquivo,
`engine.html`: o mesmo motor roda no artefato "Treinos da Nath" e no site.

Não edite `public/simulador-objecoes/*.html` à mão: esses arquivos são gerados.

## Arquivos

| Arquivo | O que é |
| --- | --- |
| `engine.html` | O motor: telas, conteúdo das 6 objeções, diagnóstico, lista de espera, eventos. A configuração fica no objeto `CONFIG`, no começo do script. |
| `build.py` | Gera as 7 páginas (`index` = tela inicial e uma por objeção) em `public/simulador-objecoes/`, com título, descrição, imagem de compartilhamento, GA4 e pixel. |
| `render_guides.py` | Gera de novo as imagens dos guias (`guia1-*` e `mitos-*`, com as versões `-sm`) quando o texto deles muda. |
| `mitos.html` | Texto e desenho do Guia 2 (mitos e verdades) de cada objeção. |

## Editar e publicar

```sh
# 1. edite tools/simulador-objecoes/engine.html (ou mitos.html)
python3 tools/simulador-objecoes/build.py
# 2. só se mudou texto de guia:
python3 tools/simulador-objecoes/render_guides.py
# 3. confira localmente: python3 -m http.server -d public 8000 → http://localhost:8000/simulador-objecoes/ta-caro.html?teste=1
```

`?teste=1` marca todos os eventos como teste: o n8n guarda, mas não avisa a equipe.

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
- `form_id: simulador_objecoes_v1`, `form_version: 1.1.0`. Ao mudar pergunta ou texto de aceite, suba a versão para manter o vínculo entre envio, versão e consentimento.
- Campos de triagem em todo evento: `segment_group` (`saude_estetica` | `saude_outra` | `fora_saude`), `business_label`, `business_other` (texto livre), `role_label`.
- Quem é de `fora_saude` vai para a lista de espera e não dispara Lead/Contact no Meta.
