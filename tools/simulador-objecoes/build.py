# Gera as páginas de smileflow.com.br/simulador-objecoes a partir do motor (engine.html, ao lado deste arquivo).
# Uso: python3 tools/simulador-objecoes/build.py   (precisa de Playwright com Chromium)
# Saída: public/simulador-objecoes/{index,ta-caro,vou-pensar,marido,medo,outra-clinica,desconto}.html
# As imagens ficam em public/simulador-objecoes/assets e não são copiadas por este script (veja o README).
#
# Em três passos:
# 1. lê do motor o texto de cada objeção (pergunta de busca, regra, abertura) para título, descrição e dados estruturados;
# 2. escreve as 7 páginas;
# 3. abre cada página num navegador e grava no HTML a primeira tela já montada (tela inicial ou tela da objeção).
#    Assim, robôs que não rodam JavaScript (ChatGPT, Claude, Perplexity) leem o mesmo texto que a pessoa vê.
import os, re, json, html, threading, functools, http.server
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'public')
BASE = '/simulador-objecoes'
ORIGIN = 'https://smileflow.com.br'
INSTAGRAM = 'https://www.instagram.com/nathmellop/'
eng = open(os.path.join(HERE, 'engine.html'), encoding='utf-8').read()
cut = eng.index('<div id="app"')
head_src, body_src = eng[:cut], eng[cut:]
head_src = re.sub(r'<title>.*?</title>\n?', '', head_src, count=1)
head_src = head_src.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
e = html.escape


def local_pages(directory, paths, fn):
    """Abre cada caminho num Chromium, servindo `directory` em 127.0.0.1. Bloqueia qualquer outra origem."""
    class Quiet(http.server.SimpleHTTPRequestHandler):
        extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.html': 'text/html; charset=utf-8'}
        def log_message(self, *a): pass
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=directory))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    root = f'http://127.0.0.1:{srv.server_address[1]}'
    out, errs = {}, []
    with sync_playwright() as p:
        b = p.chromium.launch()
        for path in paths:
            pg = b.new_page(viewport={'width': 390, 'height': 844})
            pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(root) else r.abort())
            pg.on('pageerror', lambda ex: errs.append(str(ex)))
            pg.goto(root + path); pg.wait_for_timeout(1500)
            out[path] = fn(pg)
            pg.close()
        b.close()
    srv.shutdown()
    assert not errs, errs
    return out


# 1. Texto de cada objeção, direto do motor
DATA = local_pages(HERE, ['/engine.html'], lambda pg: pg.evaluate("""() => OBJ_LIST.filter(o => OBJECTIONS[o.id]).map(({ id }) => {
  const o = OBJECTIONS[id];
  return { id, phrase: o.phrase, ask: o.ask, q: askQ(o), steps: o.rule.steps, text: o.rule.text, snippet: o.snippet, hero: o.hero, n: (o.rounds || []).length };
})"""))['/engine.html']

ORG = {'@type': 'Organization', '@id': f'{ORIGIN}/#organizacao', 'name': 'SmileFlow', 'url': ORIGIN}
NATH = {'@type': 'Person', '@id': f'{ORIGIN}/#nathalya-mello', 'name': 'Nathálya Mello', 'jobTitle': 'Especialista em vendas',
        'description': 'Sócia-fundadora e diretora comercial da SmileFlow', 'worksFor': {'@id': ORG['@id']},
        'image': f'{ORIGIN}{BASE}/assets/nath-avatar.webp', 'sameAs': [INSTAGRAM]}
HUB_URL = f'{ORIGIN}{BASE}'
HUB_NAME = 'Simulador de objeções'
HUB_TITLE = 'Como responder objeções de pacientes | Simulador grátis'
HUB_DESC = ('Treine em 3 minutos o que responder quando o paciente diz “tá caro”, “vou pensar”, “tenho medo” ou pede desconto. '
            'Grátis, com Nathálya Mello.')
BRAND = 'Treinos da Nath'   # nome que aparece na tela inicial


def crumbs(url, items):
    return {'@type': 'BreadcrumbList', '@id': url + '#trilha', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': u} for i, (n, u) in enumerate(items)]}


PAGES = []   # (arquivo, id da objeção ou 'hub', título, descrição, dados estruturados)
PAGES.append(('index', 'hub', HUB_TITLE, HUB_DESC, [ORG, NATH,
    {'@type': 'CollectionPage', '@id': HUB_URL + '#pagina', 'url': HUB_URL, 'name': HUB_NAME, 'alternateName': BRAND, 'headline': HUB_TITLE, 'description': HUB_DESC,
     'inLanguage': 'pt-BR', 'author': {'@id': NATH['@id']}, 'publisher': {'@id': ORG['@id']},
     'primaryImageOfPage': f'{ORIGIN}{BASE}/assets/og-hub.jpg', 'breadcrumb': {'@id': HUB_URL + '#trilha'},
     'mainEntity': {'@type': 'ItemList', 'itemListElement': [
         {'@type': 'ListItem', 'position': i + 1, 'url': f'{HUB_URL}/{d["id"]}', 'name': d['q']} for i, d in enumerate(DATA)]}},
    crumbs(HUB_URL, [('SmileFlow', ORIGIN), (HUB_NAME, HUB_URL)])]))
for d in DATA:
    url = f'{HUB_URL}/{d["id"]}'
    title = f'{d["q"]} | Simulação grátis'
    # A resposta vem primeiro, numa frase inteira (o snippet de cada objeção, no motor). Até 155 caracteres.
    desc = f'{d["snippet"]} Treine com {d["n"]} pacientes na simulação grátis da Nathálya Mello.'
    assert len(desc) <= 155, (d['id'], len(desc))
    PAGES.append((d['id'], d['id'], title, desc, [ORG, NATH,
        {'@type': 'WebPage', '@id': url + '#pagina', 'url': url, 'name': title, 'headline': d['q'], 'description': desc,
         'inLanguage': 'pt-BR', 'isPartOf': {'@id': HUB_URL + '#pagina'}, 'author': {'@id': NATH['@id']},
         'publisher': {'@id': ORG['@id']}, 'primaryImageOfPage': f'{ORIGIN}{BASE}/assets/og-{d["id"]}.jpg',
         'breadcrumb': {'@id': url + '#trilha'}},
        # Só a pergunta e a resposta que aparecem na tela (o "Resposta curta" da tela da objeção).
        {'@type': 'FAQPage', '@id': url + '#perguntas', 'mainEntity': [{'@type': 'Question', 'name': d['q'],
         'acceptedAnswer': {'@type': 'Answer', 'text': ' '.join(d['text'])}}]},
        crumbs(url, [('SmileFlow', ORIGIN), (HUB_NAME, HUB_URL), (d['phrase'].strip('“”').capitalize(), url)])]))
BY_ID = {d['id']: d for d in DATA}

# Medição: a camada única de smileflow.com.br (tracking/ → public/_sf/track.js). Ela carrega GA4, Meta e as outras
# plataformas só no domínio e só com ID. O stub guarda as chamadas feitas antes do script chegar.
TAGS = '''<script>window.sfTrack=window.sfTrack||function(){(window.sfTrack.q=window.sfTrack.q||[]).push(arguments)};</script>
<script async src="/_sf/track.js"></script>'''


def asset_abs(s):
    # 'assets/x' → '/simulador-objecoes/assets/x' em atributos, strings e template strings
    return re.sub(r'''(?<=["'`(])assets/''', BASE + '/assets/', s)


def sub1(s, a, b):
    assert s.count(a) == 1, a
    return s.replace(a, b)


# 2. As 7 páginas
dest = os.path.join(OUT, 'simulador-objecoes')
os.makedirs(dest, exist_ok=True)
for fname, oid, title, desc, graph in PAGES:
    body = body_src
    cfg_obj = 'ta-caro' if oid == 'hub' else oid
    b2 = body.replace("  objection: 'ta-caro',", f"  objection: '{cfg_obj}',", 1)
    assert b2 != body or cfg_obj == 'ta-caro'; body = b2
    for a, bb in [("  site: { base: '' },", f"  site: {{ base: '{BASE}' }},"),
                  ("  start: 'obj',", f"  start: '{'hub' if oid == 'hub' else 'obj'}',"),
                  ("  publicUrl: '',", f"  publicUrl: '{ORIGIN}{BASE}{'' if oid == 'hub' else '/' + oid}',")]:
        body = sub1(body, a, bb)
    url = f'{ORIGIN}{BASE}' + ('' if oid == 'hub' else '/' + oid)
    og = f'{ORIGIN}{BASE}/assets/og-{oid}.jpg'
    ld = json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False).replace('</', '<\\/')
    doc = f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="author" content="Nathálya Mello">
<meta name="theme-color" content="#120d17">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="SmileFlow">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="https://smileflow-marketing.vercel.app/favicon.ico">
<script type="application/ld+json">{ld}</script>
{TAGS}
{asset_abs(head_src).strip()}
<style>html,body{{margin:0;background:#0b080e}}</style>
</head>
<body>
{asset_abs(body).strip()}
</body>
</html>
'''
    assert "'assets/" not in doc and '"assets/' not in doc and '`assets/' not in doc, fname
    open(os.path.join(dest, fname + '.html'), 'w', encoding='utf-8').write(doc)

# 3. A primeira tela já montada no HTML
SCENE = {'hub': 'hub', **{d['id']: 'obj' for d in DATA}}
snap = local_pages(OUT, [f'{BASE}/{f}.html' for f, *_ in PAGES], lambda pg: pg.evaluate(
    "() => ({ scene: S.scene, html: document.querySelector('#s-' + S.scene).innerHTML.trim() })"))
for fname, oid, *_ in PAGES:
    path = os.path.join(dest, fname + '.html')
    doc = open(path, encoding='utf-8').read()
    got = snap[f'{BASE}/{fname}.html']
    sc = SCENE[oid]
    assert got['scene'] == sc and len(got['html']) > 500, (fname, got['scene'])
    cls = {'hub': 'scene hub pad', 'obj': 'scene objs pad'}[sc]
    doc = sub1(doc, f'<section class="{cls}" id="s-{sc}" hidden></section>', f'<section class="{cls}" id="s-{sc}">\n{got["html"]}\n</section>')
    # A abertura antiga fica escondida e com o texto da própria objeção (na tela inicial, vazia).
    d = BY_ID.get(oid)
    doc = sub1(doc, '<section class="scene hero" id="s-hero">', '<section class="scene hero" id="s-hero" hidden>')
    doc = re.sub(r'(<p class="chip" id="hero-chip"><i></i>).*?(</p>)', lambda m: m[1] + (e(d['hero']['chip']) if d else '') + m[2], doc, count=1)
    doc = re.sub(r'(<h1 class="display" id="hero-h1">).*?(</h1>)', lambda m: m[1] + (d['hero']['h1'] if d else '') + m[2], doc, count=1)
    doc = re.sub(r'(<p class="lede" id="hero-lede">).*?(</p>)', lambda m: m[1] + (e(d['hero']['lede']) if d else '') + m[2], doc, count=1)
    doc = re.sub(r'(<h2 class="storyq" id="ig-q">).*?(</h2>)', lambda m: m[1] + (f'Nos destaques do meu Instagram, tem mais conversas com <em>{d["phrase"]}{"" if d["phrase"].endswith("?”") else "."}</em>' if d else '') + m[2], doc, count=1)
    open(path, 'w', encoding='utf-8').write(doc)
    print('page', fname, len(doc))
