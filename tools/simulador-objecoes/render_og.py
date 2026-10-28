# Gera as imagens de compartilhamento da tela inicial e das 6 objeções, com o rosto da Nath em destaque:
#   share-<id>.jpg     1200×630  (WhatsApp, Facebook, LinkedIn e X usam esta)
#   share-<id>-sq.jpg  1200×1200 (para quem prefere quadrado)
# Uso: python3 tools/simulador-objecoes/build.py && python3 tools/simulador-objecoes/render_og.py
# Precisa de Playwright com Chromium. Usa a Inter de assets/fonts, os recortes da foto do VSL (assets/share-nath-*.webp)
# e a frase de cada objeção do motor. Cada arquivo fica abaixo de 300 KB, o limite do WhatsApp.
import os, threading, functools, http.server
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.abspath(os.path.join(HERE, '..', '..', 'public'))
CSS = '''@font-face{font-family:Inter;font-style:normal;font-weight:400 800;src:url(assets/fonts/inter-normal.woff2) format('woff2')}
html{font-optical-sizing:auto}
body{margin:0;background:#120d17;color:#f6f4f2;font-family:Inter,sans-serif;letter-spacing:-.011em;overflow:hidden;position:relative}
.glow{position:absolute;inset:0;background:radial-gradient(70% 90% at 0% 100%,rgba(42,31,61,.95),transparent 70%),radial-gradient(60% 70% at 40% -10%,rgba(122,74,90,.35),transparent 70%)}
.ph{position:absolute;overflow:hidden}
.ph img{width:100%;height:100%;object-fit:cover;display:block}
.chip{display:inline-flex;align-items:center;gap:12px;padding:11px 18px;border-radius:999px;background:rgba(36,26,46,.9);border:1px solid #4a3a63;font-weight:700;font-size:21px;letter-spacing:.06em;text-transform:uppercase;color:#d6a3b2}
.chip i{width:10px;height:10px;border-radius:50%;background:#d6a3b2}
h1{margin:0;font-weight:750;line-height:1.05;letter-spacing:-.028em;text-wrap:balance}
h1 em{font-style:normal;color:#d6a3b2}
.by b{display:block;font-size:27px;font-weight:750;letter-spacing:-.015em}
.by span{display:block;margin-top:4px;font-size:20px;color:#b8ada4;letter-spacing:0}
'''
WIDE = '''<!doctype html><html><head><meta charset="utf-8"><style>''' + CSS + '''
body{width:1200px;height:630px}
.ph{right:0;top:0;width:600px;height:630px}
.ph img{object-position:50% 30%}
.ph::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#120d17 0%,rgba(18,13,23,.55) 22%,rgba(18,13,23,0) 46%),linear-gradient(0deg,rgba(18,13,23,.55),rgba(18,13,23,0) 30%)}
.l{position:absolute;left:0;top:0;bottom:0;width:690px;box-sizing:border-box;padding:60px 0 56px 64px;display:flex;flex-direction:column;gap:26px}
h1{font-size:60px}
.by{margin-top:auto}
</style></head><body><div class="glow"></div><div class="ph"><img src="assets/share-nath-w.webp"></div>
<div class="l"><span class="chip" style="align-self:flex-start"><i></i>CHIP</span><h1>H1</h1><div class="by"><b>Nathálya Mello</b><span>Especialista em vendas · @nathmellop</span></div></div>
<script>const h=document.querySelector('h1');let z=60;while(h.scrollHeight>330&&z>40){z-=2;h.style.fontSize=z+'px'}</script></body></html>'''
SQUARE = '''<!doctype html><html><head><meta charset="utf-8"><style>''' + CSS + '''
body{width:1200px;height:1200px}
.ph{left:0;right:0;top:0;height:800px}
.ph img{object-position:50% 12%}
.ph::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,#120d17 0%,rgba(18,13,23,.75) 9%,rgba(18,13,23,0) 26%)}
.l{position:absolute;left:0;right:0;bottom:0;box-sizing:border-box;padding:0 72px 64px;display:flex;flex-direction:column;gap:24px}
h1{font-size:68px}
.by{margin-top:10px}
</style></head><body><div class="glow"></div><div class="ph"><img src="assets/share-nath-sq.webp"></div>
<div class="l"><span class="chip" style="align-self:flex-start"><i></i>CHIP</span><h1>H1</h1><div class="by"><b>Nathálya Mello</b><span>Especialista em vendas · @nathmellop</span></div></div>
<script>const h=document.querySelector('h1');let z=68;while(h.scrollHeight>300&&z>44){z-=2;h.style.fontSize=z+'px'}</script></body></html>'''


class Quiet(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.html': 'text/html; charset=utf-8'}
    def log_message(self, *a): pass


srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=PUBLIC))
threading.Thread(target=srv.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{srv.server_address[1]}/simulador-objecoes'
tmp = os.path.join(PUBLIC, 'simulador-objecoes', '_og.html')
assets = os.path.join(PUBLIC, 'simulador-objecoes', 'assets')
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    pg.goto(f'{base}/ta-caro.html'); pg.wait_for_timeout(1200)
    objs = pg.evaluate("() => OBJ_LIST.filter(o => OBJECTIONS[o.id]).map(({ id }) => ({ id, phrase: OBJECTIONS[id].phrase }))")
    pg.close()
    pages = [{'id': 'hub', 'chip': 'Treinos da Nath · simulação grátis', 'h1': 'Como responder às objeções de pacientes <em>que travam a venda.</em>'}]
    pages.append({'id': 'perfil', 'chip': 'Perfil de negociação · grátis', 'h1': 'Por que você trava <em>na hora do preço?</em>'})
    for o in objs:
        end = '' if o['phrase'].endswith('?”') else '?'
        pages.append({'id': o['id'], 'chip': 'Simulação grátis · 2 min', 'h1': f"O que responder quando o paciente diz <em>{o['phrase']}</em>{end}"})
    try:
        for tpl, (w, h), suf in ((WIDE, (1200, 630), ''), (SQUARE, (1200, 1200), '-sq')):
            pg = b.new_page(viewport={'width': w, 'height': h})
            for it in pages:
                open(tmp, 'w', encoding='utf-8').write(tpl.replace('CHIP', it['chip']).replace('H1', it['h1']))
                pg.goto(f"{base}/_og.html?v={it['id']}{suf}"); pg.wait_for_timeout(800)   # ?v= evita reaproveitar a página anterior
                assert pg.evaluate("document.fonts.check('700 60px Inter')"), 'Inter não carregou'
                assert pg.evaluate("document.querySelector('.ph img').naturalWidth > 0"), 'a foto não carregou'
                out = os.path.join(assets, f"share-{it['id']}{suf}.jpg")
                for q in (88, 84, 80, 76):
                    pg.screenshot(path=out, type='jpeg', quality=q)
                    if os.path.getsize(out) < 290_000: break
                print(f"ok share-{it['id']}{suf}.jpg {os.path.getsize(out) // 1024} KB")
            pg.close()
    finally:
        os.remove(tmp)
    b.close()
srv.shutdown()
