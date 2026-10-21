# Gera de novo as imagens dos guias a partir do texto do motor.
# Uso: python3 tools/simulador-objecoes/build.py && python3 tools/simulador-objecoes/render_guides.py
# Precisa de Playwright com Chromium e de internet (as fontes vêm do Google Fonts).
# Saída em public/simulador-objecoes/assets:
#   guia1-<id>.webp, guia1-<id>-sm.webp e guia1-<id>.jpg (o guia, desenhado por drawGift() do motor; o .jpg é o do botão Baixar)
import base64, io, os, threading, functools, http.server
from playwright.sync_api import sync_playwright
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.abspath(os.path.join(HERE, '..', '..', 'public'))
ASSETS = os.path.join(PUBLIC, 'simulador-objecoes', 'assets')
IDS = ['ta-caro', 'vou-pensar', 'marido', 'medo', 'outra-clinica', 'desconto']


class Quiet(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.html': 'text/html; charset=utf-8'}
    def log_message(self, *a): pass


def save(data_url, name):
    im = Image.open(io.BytesIO(base64.b64decode(data_url.split(',')[1]))).convert('RGB')
    im.save(os.path.join(ASSETS, f'{name}.webp'), 'WEBP', quality=82, method=6)
    im.resize((360, 640), Image.LANCZOS).save(os.path.join(ASSETS, f'{name}-sm.webp'), 'WEBP', quality=80, method=6)
    if name.startswith('guia1-'):   # a versão para baixar no celular (botão "Baixar o guia")
        im.save(os.path.join(ASSETS, f'{name}.jpg'), 'JPEG', quality=88, optimize=True, progressive=True)
    print('ok', name, im.size)


srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=PUBLIC))
threading.Thread(target=srv.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{srv.server_address[1]}/simulador-objecoes'
errs = []
with sync_playwright() as p:
    b = p.chromium.launch()
    for oid in IDS:
        pg = b.new_page(viewport={'width': 390, 'height': 844})
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(f'{base}/{oid}.html'); pg.wait_for_timeout(1500)
        save(pg.evaluate(f"(async () => {{ useObjection('{oid}'); return await drawGift(); }})()"), f'guia1-{oid}')
        pg.close()
    b.close()
srv.shutdown()
print('erros:', errs or 'nenhum')
