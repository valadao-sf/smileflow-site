# Gera as páginas de smileflow.com.br/simulador-objecoes a partir do motor (engine.html, ao lado deste arquivo).
# Uso: python3 tools/simulador-objecoes/build.py
# Saída: public/simulador-objecoes/{index,ta-caro,vou-pensar,marido,medo,outra-clinica,desconto}.html
# As imagens ficam em public/simulador-objecoes/assets e não são copiadas por este script (veja o README).
import sys, os, re, shutil, json, html
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'public')
BASE = '/simulador-objecoes'
ORIGIN = 'https://smileflow.com.br'
eng = open(os.path.join(HERE, 'engine.html'), encoding='utf-8').read()
cut = eng.index('<div id="app"')
head_src, body_src = eng[:cut], eng[cut:]
head_src = re.sub(r'<title>.*?</title>\n?', '', head_src, count=1)
head_src = head_src.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')

def hero(oid):
    i = eng.index(f"id: '{oid}', title:"); j = eng.index('  hero: {', i); k = eng.index('  },', j)
    blk = eng[j:k]
    h1 = re.sub(r'<[^>]+>', '', re.search(r"h1: '([^']*)'", blk).group(1))
    lede = re.search(r"lede: '([^']*)'", blk).group(1)
    return h1, lede
PAGES = [('index', 'hub', 'Simulador de objeções · Nathálya Mello',
          'Exercícios rápidos para as 6 objeções que mais travam uma venda. Cada exercício libera um guia de uma página para consultar antes da próxima conversa.')]
NAMES = {'ta-caro': '“Tá caro”', 'vou-pensar': '“Vou pensar”', 'marido': '“Preciso falar com meu marido”', 'medo': '“Tenho medo”',
         'outra-clinica': '“Na outra clínica é mais barato”', 'desconto': '“Faz um desconto?”'}
for oid, nm in NAMES.items():
    h1, lede = hero(oid)
    PAGES.append((oid, oid, f'Simulação {nm} · Nathálya Mello', lede))

TAGS = '''<script>
(function(){var h=location.hostname;if(h!=='smileflow.com.br'&&h!=='www.smileflow.com.br')return;
var s=document.createElement('script');s.async=1;s.src='https://www.googletagmanager.com/gtag/js?id=G-ZC4Y4L1YQN';document.head.appendChild(s);
window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','G-ZC4Y4L1YQN');
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','888486630406077');fbq('track','PageView');})();
</script>'''

def asset_abs(s):
    # 'assets/x' → '/simulador-objecoes/assets/x' em atributos, strings e template strings
    return re.sub(r'''(?<=["'`(])assets/''', BASE + '/assets/', s)

dest = os.path.join(OUT, 'simulador-objecoes')
os.makedirs(dest, exist_ok=True)
for fname, oid, title, desc in PAGES:
    body = body_src
    cfg_obj = 'ta-caro' if oid == 'hub' else oid
    b2 = body.replace("  objection: 'ta-caro',", f"  objection: '{cfg_obj}',", 1)
    assert b2 != body or cfg_obj == 'ta-caro'; body = b2
    for a, bb in [("  site: { base: '' },", f"  site: {{ base: '{BASE}' }},"),
                  ("  start: 'obj',", f"  start: '{'hub' if oid == 'hub' else 'obj'}',"),
                  ("  publicUrl: '',", f"  publicUrl: '{ORIGIN}{BASE}{'' if oid == 'hub' else '/' + oid}',")]:
        assert body.count(a) == 1, a; body = body.replace(a, bb)
    url = f'{ORIGIN}{BASE}' + ('' if oid == 'hub' else '/' + oid)
    og = f'{ORIGIN}{BASE}/assets/og-{oid}.jpg'
    e = html.escape
    doc = f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta name="robots" content="index, follow">
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
    print('page', fname, len(doc))
