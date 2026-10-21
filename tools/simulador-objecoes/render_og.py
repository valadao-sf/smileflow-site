# Gera de novo as imagens de compartilhamento (og-<id>.jpg, 1200×630) da tela inicial e das 6 objeções.
# Uso: python3 tools/simulador-objecoes/build.py && python3 tools/simulador-objecoes/render_og.py
# Precisa de Playwright com Chromium. Usa a Inter de assets/fonts e o texto de abertura de cada objeção do motor.
import os, threading, functools, http.server
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.abspath(os.path.join(HERE, '..', '..', 'public'))
FACES = ['s44', 's36', 's79', 's22']
TPL = '''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Inter;font-style:normal;font-weight:400 800;src:url(assets/fonts/inter-normal.woff2) format('woff2')}
html{font-optical-sizing:auto}
body{margin:0;width:1200px;height:630px;background:#120d17;color:#f6f4f2;font-family:Inter,sans-serif;letter-spacing:-.011em;overflow:hidden;display:flex}
.l{flex:1;padding:64px 56px 56px 64px;display:flex;flex-direction:column;gap:22px;min-width:0}
.chip{align-self:flex-start;display:inline-flex;align-items:center;gap:10px;padding:10px 16px;border-radius:999px;background:#241a2e;border:1px solid #3a2f4a;font-weight:600;font-size:22px;letter-spacing:0}
.chip i{width:10px;height:10px;border-radius:50%;background:#d6a3b2}
h1{margin:0;font-weight:700;font-size:62px;line-height:1.06;letter-spacing:-.022em;text-wrap:balance}
h1 em{font-style:normal;color:#d6a3b2}
.by{margin-top:auto;display:flex;align-items:center;gap:16px}.by img{width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid #f6f4f2}
.by b{display:block;font-size:24px;font-weight:700}.by span{display:block;font-size:19px;color:#b8ada4;letter-spacing:0}
.r{width:430px;display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:24px 24px 24px 0;transform:rotate(-4deg) translateY(-20px)}
.r img{width:100%;height:290px;object-fit:cover;border-radius:16px;filter:saturate(.9)}
.r img:nth-child(even){transform:translateY(60px)}
</style></head><body><div class="l"><span class="chip"><i></i>CHIP</span><h1>H1</h1>
<div class="by"><img src="assets/nath-avatar.webp"><div><b>Nathálya Mello</b><span>Especialista em vendas · @nathmellop</span></div></div></div>
<div class="r">FACES</div></body></html>'''


class Quiet(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.html': 'text/html; charset=utf-8'}
    def log_message(self, *a): pass


srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=PUBLIC))
threading.Thread(target=srv.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{srv.server_address[1]}/simulador-objecoes'
tmp = os.path.join(PUBLIC, 'simulador-objecoes', '_og.html')
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    pg.goto(f'{base}/ta-caro.html'); pg.wait_for_timeout(1200)
    heroes = pg.evaluate("() => OBJ_LIST.filter(o => OBJECTIONS[o.id]).map(({ id }) => ({ id, chip: OBJECTIONS[id].hero.chip, h1: OBJECTIONS[id].hero.h1 }))")
    pages = [{'id': 'hub', 'chip': '6 simulações grátis · 3 min cada · um guia para baixar',
              'h1': 'Como responder às objeções <em>que travam a venda.</em>'}] + heroes
    pg.close()
    pg = b.new_page(viewport={'width': 1200, 'height': 630})
    try:
        for it in pages:
            html = TPL.replace('CHIP', it['chip']).replace('H1', it['h1']).replace('FACES', ''.join(f'<img src="assets/{f}.webp">' for f in FACES))
            open(tmp, 'w', encoding='utf-8').write(html)
            pg.goto(f"{base}/_og.html?v={it['id']}"); pg.wait_for_timeout(700)   # ?v= evita o navegador reaproveitar a página anterior
            assert pg.evaluate("document.fonts.check('700 62px Inter')"), 'Inter não carregou'
            pg.screenshot(path=os.path.join(PUBLIC, 'simulador-objecoes', 'assets', f"og-{it['id']}.jpg"), type='jpeg', quality=86)
            print('ok og-' + it['id'])
    finally:
        os.remove(tmp)
    b.close()
srv.shutdown()
