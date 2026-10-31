# Gera as páginas de smileflow.com.br/simulador-objecoes a partir do motor (engine.html, ao lado deste arquivo).
# Uso: python3 tools/simulador-objecoes/build.py   (precisa de Playwright com Chromium)
# Saída: public/simulador-objecoes/{index,ta-caro,vou-pensar,marido,medo,outra-clinica,desconto}.html
#        e public/simulador-objecoes/guia/<objeção>.html (a página do guia, com o PDF de guia/guia-<objeção>.pdf)
# As imagens ficam em public/simulador-objecoes/assets e não são copiadas por este script (veja o README).
#
# Em três passos:
# 1. lê do motor o texto de cada objeção (pergunta de busca, regra, abertura) para título, descrição e dados estruturados;
# 2. escreve as 7 páginas;
# 3. abre cada página num navegador e grava no HTML a primeira tela já montada (tela inicial ou tela da objeção).
#    Assim, robôs que não rodam JavaScript (ChatGPT, Claude, Perplexity) leem o mesmo texto que a pessoa vê.
import os, re, json, html, threading, functools, http.server, subprocess, datetime
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'public')
BASE = '/simulador-objecoes'
ORIGIN = 'https://www.smileflow.com.br'
INSTAGRAM = 'https://www.instagram.com/nathmellop/'
TIKTOK = 'https://www.tiktok.com/@nathmellop'
PANDA_EMBED = 'https://player-vz-d1cffb40-f54.tv.pandavideo.com.br/embed/?v='
# Datas reais: publicação = primeiro commit do motor; atualização = o dia em que as páginas foram geradas.
UPDATED = datetime.date.today().isoformat()
try:
    PUBLISHED = subprocess.run(['git', 'log', '--diff-filter=A', '--format=%cs', '--', 'engine.html'], cwd=os.path.dirname(os.path.abspath(__file__)),
                               capture_output=True, text=True).stdout.split()[-1]
except Exception:
    PUBLISHED = UPDATED
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
  return { id, phrase: o.phrase, ask: o.ask, q: askQ(o), steps: o.rule.steps, text: o.rule.text, snippet: o.snippet, hero: o.hero, n: SIM_N,
           faq: aeoFaq(o), video: aeoVideo(o), guide: o.gift.text };
})"""))['/engine.html']

ORG = {'@type': 'Organization', '@id': f'{ORIGIN}/#organizacao', 'name': 'SmileFlow', 'url': ORIGIN}
NATH = {'@type': 'Person', '@id': f'{ORIGIN}/#nathalya-mello', 'name': 'Nathálya Mello', 'jobTitle': 'Especialista em vendas',
        'description': 'Sócia-fundadora e diretora comercial da SmileFlow', 'worksFor': {'@id': ORG['@id']},
        'image': f'{ORIGIN}{BASE}/assets/nath-avatar.webp', 'sameAs': [INSTAGRAM, TIKTOK],
        'knowsAbout': ['Vendas em clínicas de saúde e estética', 'Objeções de pacientes', 'Negociação de orçamentos',
                       'Treinamento de equipes comerciais']}
# Sobe quando as imagens de compartilhamento mudam, para WhatsApp, Facebook e LinkedIn buscarem a nova.
OG_V = '3'
HUB_URL = f'{ORIGIN}{BASE}'
HUB_NAME = 'Simulador de objeções'
HUB_TITLE = 'Como responder objeções de pacientes | Simulador grátis'
HUB_DESC = ('Treine em 6 minutos o que responder quando o paciente diz “tá caro”, “vou pensar”, “tenho medo” ou pede desconto. '
            'Grátis, com Nathálya Mello.')
BRAND = 'Treinos da Nath'   # nome que aparece na tela inicial


def crumbs(url, items):
    return {'@type': 'BreadcrumbList', '@id': url + '#trilha', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': u} for i, (n, u) in enumerate(items)]}


PAGES = []   # (arquivo, id da objeção ou 'hub', título, descrição, dados estruturados)
PAGES.append(('index', 'hub', HUB_TITLE, HUB_DESC, [ORG, NATH,
    {'@type': 'CollectionPage', '@id': HUB_URL + '#pagina', 'url': HUB_URL, 'name': HUB_NAME, 'alternateName': BRAND, 'headline': HUB_TITLE, 'description': HUB_DESC,
     'inLanguage': 'pt-BR', 'author': {'@id': NATH['@id']}, 'publisher': {'@id': ORG['@id']},
     'primaryImageOfPage': f'{ORIGIN}{BASE}/assets/share-hub.jpg', 'breadcrumb': {'@id': HUB_URL + '#trilha'},
     'mainEntity': {'@type': 'ItemList', 'itemListElement': [
         {'@type': 'ListItem', 'position': i + 1, 'url': f'{HUB_URL}/{d["id"]}', 'name': d['q'], 'description': d['snippet']} for i, d in enumerate(DATA)]},
     'datePublished': PUBLISHED, 'dateModified': UPDATED},
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
         'publisher': {'@id': ORG['@id']}, 'primaryImageOfPage': f'{ORIGIN}{BASE}/assets/share-{d["id"]}.jpg',
         'breadcrumb': {'@id': url + '#trilha'}, 'datePublished': PUBLISHED, 'dateModified': UPDATED},
        # A pergunta e a resposta que aparecem na página ("O que a Nath diz").
        {'@type': 'FAQPage', '@id': url + '#perguntas', 'mainEntity': [{'@type': 'Question', 'name': f['q'],
         'acceptedAnswer': {'@type': 'Answer', 'text': f['a']}} for f in d['faq'][:1]]},
        *([{'@type': 'VideoObject', '@id': url + '#video', 'name': f'Nathálya Mello: {d["video"]["title"]}',
            'description': d['snippet'], 'thumbnailUrl': f'{ORIGIN}{BASE}/{d["video"]["poster"]}', 'uploadDate': PUBLISHED,
            'embedUrl': PANDA_EMBED + d['video']['id'], 'inLanguage': 'pt-BR', 'transcript': ' '.join(d['video']['script']),
            'author': {'@id': NATH['@id']}, 'publisher': {'@id': ORG['@id']}}] if d['video'] else []),
        crumbs(url, [('SmileFlow', ORIGIN), (HUB_NAME, HUB_URL), (d['phrase'].strip('“”').capitalize(), url)])]))
PERFIL_URL = f'{ORIGIN}/perfil-de-negociacao'
PERFIL_TITLE = 'Por que você trava na hora do preço? | Perfil de negociação'
PERFIL_DESC = 'Responda 4 perguntas rápidas e veja o vídeo da Nathálya Mello sobre o que faz você travar na hora de falar o preço. Grátis.'
assert len(PERFIL_DESC) <= 155
PAGES.append(('perfil-de-negociacao', 'perfil', PERFIL_TITLE, PERFIL_DESC, [ORG, NATH,
    {'@type': 'WebPage', '@id': PERFIL_URL + '#pagina', 'url': PERFIL_URL, 'name': PERFIL_TITLE, 'description': PERFIL_DESC, 'inLanguage': 'pt-BR',
     'author': {'@id': NATH['@id']}, 'publisher': {'@id': ORG['@id']}, 'primaryImageOfPage': f'{ORIGIN}{BASE}/assets/share-perfil.jpg',
     'datePublished': UPDATED, 'dateModified': UPDATED}]))
BY_ID = {d['id']: d for d in DATA}

# Medição: a camada única de smileflow.com.br (tracking/ → public/_sf/track.js). Ela carrega GA4, Meta e as outras
# plataformas só no domínio e só com ID. O stub guarda as chamadas feitas antes do script chegar.
TAGS = '''<script>window.sfTrack=window.sfTrack||function(){(window.sfTrack.q=window.sfTrack.q||[]).push(arguments)};</script>
<script async src="/_sf/track.js"></script>'''


def asset_abs(s):
    # 'assets/x' → '/simulador-objecoes/assets/x' em atributos, strings e template strings,
    # e também depois da vírgula de um srcset ("…240w, assets/p44.webp 720w"): na tela inicial
    # (/simulador-objecoes, sem barra no fim) um caminho relativo vira /assets/… e dá 404.
    s = re.sub(r'''(?<=["'`(])assets/''', BASE + '/assets/', s)
    return re.sub(r'(?<=w, )assets/', BASE + '/assets/', s)


def sub1(s, a, b):
    assert s.count(a) == 1, a
    return s.replace(a, b)


# 2. As 8 páginas (7 do simulador + o perfil de negociação, que fica fora da pasta do simulador)
dest = os.path.join(OUT, 'simulador-objecoes')
os.makedirs(dest, exist_ok=True)
out_path = lambda f: os.path.join(OUT, f + '.html') if f == 'perfil-de-negociacao' else os.path.join(dest, f + '.html')
web_path = lambda f: f'/{f}.html' if f == 'perfil-de-negociacao' else f'{BASE}/{f}.html'
for fname, oid, title, desc, graph in PAGES:
    body = body_src
    cfg_obj = 'ta-caro' if oid in ('hub', 'perfil') else oid
    b2 = body.replace("  objection: 'ta-caro',", f"  objection: '{cfg_obj}',", 1)
    assert b2 != body or cfg_obj == 'ta-caro'; body = b2
    for a, bb in [("  site: { base: '' },", f"  site: {{ base: '{BASE}' }},"),
                  ("  start: 'obj',", f"  start: '{ {'hub': 'hub', 'perfil': 'fn'}.get(oid, 'obj') }',"),
                  ("  publicUrl: '',", f"  publicUrl: '{PERFIL_URL if oid == 'perfil' else ORIGIN + BASE + ('' if oid == 'hub' else '/' + oid)}',"),
                  ("  standalone: false,", f"  standalone: {'true' if oid == 'perfil' else 'false'},"),
                  ("  updated: '',", f"  updated: '{UPDATED}',")]:
        body = sub1(body, a, bb)
    url = PERFIL_URL if oid == 'perfil' else f'{ORIGIN}{BASE}' + ('' if oid == 'hub' else '/' + oid)
    og = f'{ORIGIN}{BASE}/assets/share-{oid}.jpg?v={OG_V}'   # perfil: share-perfil.jpg   # 1200×630 (WhatsApp, Facebook, LinkedIn, X)
    og_sq = f'{ORIGIN}{BASE}/assets/share-{oid}-sq.jpg?v={OG_V}'   # 1200×1200 (quem prefere quadrado)
    og_alt = 'Nathálya Mello, especialista em vendas, na simulação grátis: ' + title.split(' | ')[0]
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
<meta property="og:image:secure_url" content="{og}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{e(og_alt)}">
<meta property="og:image" content="{og_sq}">
<meta property="og:image:secure_url" content="{og_sq}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="1200">
<meta property="og:image:alt" content="{e(og_alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(title)}">
<meta name="twitter:description" content="{e(desc)}">
<meta name="twitter:image" content="{og}">
<meta name="twitter:image:alt" content="{e(og_alt)}">
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
    assert "'assets/" not in doc and '"assets/' not in doc and '`assets/' not in doc and 'w, assets/' not in doc, fname
    open(out_path(fname), 'w', encoding='utf-8').write(doc)

# 3. A primeira tela já montada no HTML
SCENE = {'hub': 'hub', 'perfil': 'fn', **{d['id']: 'obj' for d in DATA}}
snap = local_pages(OUT, [web_path(f) for f, *_ in PAGES], lambda pg: pg.evaluate(
    "() => ({ scene: S.scene, html: document.querySelector('#s-' + S.scene).innerHTML.trim() })"))
for fname, oid, *_ in PAGES:
    path = out_path(fname)
    doc = open(path, encoding='utf-8').read()
    got = snap[web_path(fname)]
    sc = SCENE[oid]
    assert got['scene'] == sc and len(got['html']) > 500, (fname, got['scene'])
    cls = {'hub': 'scene hub pad', 'obj': 'scene objs pad', 'fn': 'scene pad'}[sc]
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

# 4. Páginas do guia: depois do envio dos dados, a pessoa vem para cá. Página leve, sem o motor, com o PDF estático
#    (o link baixa direto, inclusive no navegador interno do Instagram e do ChatGPT) e um endereço que dá para reabrir.
#    Os PDFs e as prévias (guia-<objeção>.pdf, thumb-guia-<objeção>.png) ficam em public/simulador-objecoes/guia.
GUIA_DIR = os.path.join(dest, 'guia')
GUIA_CSS = """<style>html,body{margin:0;background:#0b080e}
.guiapg{box-sizing:border-box;max-width:480px;margin:0 auto;padding:22px 18px 40px;display:flex;flex-direction:column;gap:16px}
.guiapg h1{margin:0}.guiapg .note{margin:0}.guiapg .gthumb img{display:block;width:100%;height:auto;border-radius:14px}
.guiapg .btn svg{width:20px;height:20px;flex:none}</style>"""
DOWN = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
        'stroke-linejoin="round" d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"/></svg>')
for d in DATA:
    oid = d['id']
    pdf, thumb = f'guia-{oid}.pdf', f'thumb-guia-{oid}.png'
    assert os.path.exists(os.path.join(GUIA_DIR, pdf)) and os.path.exists(os.path.join(GUIA_DIR, thumb)), oid
    url = f'{ORIGIN}{BASE}/guia/{oid}'
    title = f'Seu guia: {d["q"]} | Nathálya Mello'
    doc = f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#120d17">
<link rel="icon" href="https://smileflow-marketing.vercel.app/favicon.ico">
{TAGS}
{asset_abs(head_src).strip()}
{GUIA_CSS}
</head>
<body>
<main class="guiapg">
  <p class="eyebrow">Seu guia está liberado</p>
  <h1 class="display" style="font-size:30px">As perguntas para usar no próximo {e(d["phrase"])}</h1>
  <a class="btn btn-main" id="guia-pdf" href="{BASE}/guia/{pdf}" download="guia-{oid}-nathalya-mello.pdf">{DOWN}Baixar o guia (PDF)</a>
  <p class="note">Se o download não começar, toque no botão de novo ou abra o PDF e salve no celular.</p>
  <a class="gthumb" href="{BASE}/guia/{pdf}" data-pdf="imagem"><img src="{BASE}/guia/{thumb}" alt="Prévia do guia: {e(d["q"])}"></a>
  <a class="btn btn-ghost" href="{BASE}/{oid}">Voltar ao simulador</a>
</main>
<script>
(function () {{
  function pdf(where) {{ try {{ window.sfTrack('guia_pdf_baixado', {{ objection: '{oid}', objecao: '{oid}', where: where }}); }} catch (e) {{}} }}
  document.getElementById('guia-pdf').addEventListener('click', function () {{ pdf('botao'); }});
  document.querySelector('[data-pdf]').addEventListener('click', function () {{ pdf('imagem'); }});
}})();
</script>
</body>
</html>
'''
    assert "'assets/" not in doc and '"assets/' not in doc and '`assets/' not in doc and 'w, assets/' not in doc, oid
    open(os.path.join(GUIA_DIR, oid + '.html'), 'w', encoding='utf-8').write(doc)
    print('guia', oid, len(doc))
