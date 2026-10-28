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

# Guia de Objeções: capa + os 6 guias + contracapa, num PDF só (é o que a automação do Instagram envia com a palavra OBJEÇÃO).
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=PUBLIC))
threading.Thread(target=srv.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{srv.server_address[1]}/simulador-objecoes'
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.goto(f'{base}/index.html'); pg.wait_for_timeout(1500)
    covers = {k: pg.evaluate(f"drawGuideCover('{k}')") for k in ('capa', 'contracapa')}
    cta = pg.evaluate("window.__guideCta")
    b.close()
srv.shutdown()
def img(data_url): return Image.open(io.BytesIO(base64.b64decode(data_url.split(',')[1]))).convert('RGB')
capa, contra = img(covers['capa']), img(covers['contracapa'])
capa.save(os.path.join(ASSETS, 'guia-objecoes-capa.webp'), 'WEBP', quality=84, method=6)
capa.resize((180, 320), Image.LANCZOS).save(os.path.join(ASSETS, 'guia-objecoes-capa-sm.webp'), 'WEBP', quality=82, method=6)
pages = [capa] + [Image.open(os.path.join(ASSETS, f'guia1-{oid}.jpg')).convert('RGB') for oid in IDS] + [contra]
pdf = os.path.join(ASSETS, 'guia-de-objecoes-nathalya-mello.pdf')
pages[0].save(pdf, 'PDF', resolution=150, save_all=True, append_images=pages[1:])
# Link clicável na contracapa (botão + endereço) para o perfil de negociação, e na capa para o Instagram da Nath.
from pypdf import PdfReader, PdfWriter
from pypdf.annotations import Link
from pypdf.generic import NameObject, DictionaryObject, TextStringObject
rd = PdfReader(pdf); wr = PdfWriter(); wr.append(rd)
def link(page_i, box, url):
    pg_ = wr.pages[page_i]; pw, ph = float(pg_.mediabox.width), float(pg_.mediabox.height); k = pw / 1080
    x0, y0, w, h = box
    ann = Link(rect=(x0 * k, ph - (y0 + h) * k, (x0 + w) * k, ph - y0 * k), url=url)
    wr.add_annotation(page_number=page_i, annotation=ann)
link(len(pages) - 1, (cta['x'], cta['y'], cta['w'], cta['h']), 'https://www.smileflow.com.br/perfil-de-negociacao?utm_source=guia&utm_medium=pdf&utm_campaign=guia-objecoes')
link(len(pages) - 1, (0, 1660, 1080, 160), 'https://www.instagram.com/nathmellop/')
with open(pdf, 'wb') as f: wr.write(f)
print('ok PDF', len(pages), 'páginas', os.path.getsize(pdf) // 1024, 'KB')
