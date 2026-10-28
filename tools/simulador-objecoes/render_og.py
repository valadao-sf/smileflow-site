# Gera as imagens de compartilhamento da tela inicial e das 6 objeções, com o rosto da Nath em destaque:
#   share-<id>.jpg     1200×630  (WhatsApp, Facebook, LinkedIn e X usam esta)
#   share-<id>-sq.jpg  1200×1200 (para quem prefere quadrado)
# Uso: python3 tools/simulador-objecoes/build.py && python3 tools/simulador-objecoes/render_og.py
# Precisa de Playwright com Chromium. Usa a Inter de assets/fonts, a foto da Nath de fundo roxo (assets/share-nath-roxo.webp, ampliada da nath-avatar)
# e a frase de cada objeção do motor. Cada arquivo fica abaixo de 300 KB, o limite do WhatsApp.
import os, threading, functools, http.server
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.abspath(os.path.join(HERE, '..', '..', 'public'))
CSS = '''@font-face{font-family:Inter;font-style:normal;font-weight:400 800;src:url(assets/fonts/inter-normal.woff2) format('woff2')}
html{font-optical-sizing:auto}
body{margin:0;background:#1b1029;color:#f6f4f2;font-family:Inter,sans-serif;letter-spacing:-.011em;overflow:hidden;position:relative}
/* o roxo da foto da Nath se espalha pela imagem: um halo atrás do retrato e o fundo escurecendo para as bordas */
.bg{position:absolute;inset:0;background:radial-gradient(60% 75% at var(--hx) var(--hy),#6a3aa0 0%,#3d2160 38%,rgba(27,16,41,0) 72%),linear-gradient(160deg,#2a1840,#140b1f 70%)}
.grain{position:absolute;inset:0;opacity:.04;background-image:repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 7px)}
.ph{position:absolute;border-radius:50%;padding:8px;background:linear-gradient(140deg,#e7b9c7,#b57ac9 55%,#6a3aa0);box-shadow:0 30px 80px rgba(8,4,14,.6)}
.ph img{display:block;width:100%;height:100%;border-radius:50%;object-fit:cover}
.tag{position:absolute;display:flex;align-items:center;gap:10px;padding:10px 18px 10px 12px;border-radius:999px;background:#f6f4f2;color:#1b1029;font-weight:750;font-size:22px;letter-spacing:-.01em;box-shadow:0 12px 30px rgba(8,4,14,.45)}
.tag svg{width:26px;height:26px}
.chip{display:inline-flex;align-items:center;gap:12px;padding:11px 18px;border-radius:999px;background:rgba(246,244,242,.08);border:1px solid rgba(231,185,199,.45);font-weight:700;font-size:20px;letter-spacing:.07em;text-transform:uppercase;color:#e7b9c7}
.chip i{width:10px;height:10px;border-radius:50%;background:#e7b9c7}
h1{margin:0;font-weight:780;line-height:1.04;letter-spacing:-.03em;text-wrap:balance}
h1 em{font-style:normal;color:#e7b9c7}
.by b{display:block;font-size:28px;font-weight:750;letter-spacing:-.015em}
.by span{display:block;margin-top:4px;font-size:20px;color:#c9b9d6;letter-spacing:0}
'''
IG = '<svg viewBox="0 0 24 24" fill="none" stroke="#1b1029" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.1" fill="#1b1029" stroke="none"/></svg>'
WIDE = '''<!doctype html><html><head><meta charset="utf-8"><style>''' + CSS + '''
body{width:1200px;height:630px;--hx:80%;--hy:50%}
.ph{right:70px;top:95px;width:424px;height:424px}
.tag{right:120px;top:478px}
.l{position:absolute;left:0;top:0;bottom:0;width:680px;box-sizing:border-box;padding:62px 0 58px 68px;display:flex;flex-direction:column;gap:26px}
h1{font-size:62px}
.by{margin-top:auto}
</style></head><body><div class="bg"></div><div class="grain"></div><div class="ph"><img src="assets/share-nath-roxo.webp"></div>
<span class="tag">''' + IG + '''@nathmellop</span>
<div class="l"><span class="chip" style="align-self:flex-start"><i></i>CHIP</span><h1>H1</h1><div class="by"><b>Nathálya Mello</b><span>Especialista em vendas para clínicas</span></div></div>
<script>const h=document.querySelector('h1');let z=62;while(h.scrollHeight>330&&z>40){z-=2;h.style.fontSize=z+'px'}</script></body></html>'''
# Quadrada: vira miniatura pequena (WhatsApp, iMessage), então só o rosto grande e poucas palavras.
SQUARE = '''<!doctype html><html><head><meta charset="utf-8"><style>''' + CSS + '''
body{width:1200px;height:1200px;--hx:50%;--hy:34%}
.ph{left:50%;top:64px;width:680px;height:680px;padding:12px;transform:translateX(-50%)}
.tag{left:50%;top:712px;transform:translateX(-50%);font-size:30px;padding:13px 24px 13px 16px}
.tag svg{width:34px;height:34px}
.l{position:absolute;left:0;right:0;top:820px;bottom:0;box-sizing:border-box;padding:0 70px 60px;display:flex;align-items:center;justify-content:center;text-align:center}
h1{font-size:96px;line-height:1.02}
</style></head><body><div class="bg"></div><div class="grain"></div><div class="ph"><img src="assets/share-nath-roxo.webp"></div>
<span class="tag">''' + IG + '''@nathmellop</span>
<div class="l"><h1>SHORT</h1></div>
<script>const h=document.querySelector('h1');let z=96;while(h.scrollHeight>300&&z>52){z-=2;h.style.fontSize=z+'px'}</script></body></html>'''


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
    pages = [{'id': 'hub', 'chip': 'Treinos da Nath · simulação grátis', 'h1': 'Como responder às objeções de pacientes <em>que travam a venda.</em>',
              'short': 'Objeções que <em>travam a venda</em>'}]
    pages.append({'id': 'perfil', 'chip': 'Perfil de negociação · grátis', 'h1': 'Por que você trava <em>na hora do preço?</em>',
                  'short': 'Por que você trava <em>no preço?</em>'})
    for o in objs:
        end = '' if o['phrase'].endswith('?”') else '?'
        pages.append({'id': o['id'], 'chip': 'Simulação grátis · 2 min', 'h1': f"O que responder quando o paciente diz <em>{o['phrase']}</em>{end}",
                      'short': f"<em>{o['phrase'][0]}{o['phrase'][1].upper()}{o['phrase'][2:]}</em>"})
    try:
        for tpl, (w, h), suf in ((WIDE, (1200, 630), ''), (SQUARE, (1200, 1200), '-sq')):
            pg = b.new_page(viewport={'width': w, 'height': h})
            for it in pages:
                open(tmp, 'w', encoding='utf-8').write(tpl.replace('CHIP', it['chip']).replace('H1', it['h1']).replace('SHORT', it['short']))
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
