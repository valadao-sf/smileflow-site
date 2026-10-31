# Checa as 6 páginas geradas, sem JS (rode depois do build.py):
# - FAQPage (texto) == explicação visível da Nath (#84: o FAQPage só tem a pergunta que continua visível);
# - a explicação vem antes do botão principal da simulação (cartão .ex.first);
# - o botão repetido no topo (.obtop, só abaixo de 900px) é aceito: ele pode vir antes da explicação,
#   mas tem de existir e sumir a partir de 900px, para no desktop a ordem ser explicação → botão.
# Uso: python3 tools/simulador-objecoes/check_faq.py [raiz_do_repo]
import re, json, html, sys, os
root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
ok = True
for oid in ['ta-caro', 'vou-pensar', 'marido', 'medo', 'outra-clinica', 'desconto']:
    s = open(os.path.join(root, 'public', 'simulador-objecoes', f'{oid}.html'), encoding='utf-8').read()
    ld = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', s, re.S).group(1).replace('<\\/', '</'))
    faq = [n for n in ld['@graph'] if n['@type'] == 'FAQPage'][0]['mainEntity'][0]
    i = s.index('id="s-obj">'); j = s.index('</section>', s.index('id="obchat-h"'))
    blk = s[i:j]
    k = blk.index('id="obchat-h"')
    vis = ' '.join(html.unescape(re.sub(r'<[^>]+>', '', p)) for p in re.findall(r'<p>(.*?)</p>', blk[k:], re.S))
    h1 = html.unescape(re.sub(r'<[^>]+>', '', re.search(r'<h1>(.*?)</h1>', blk, re.S).group(1))).replace('  ', ' ').strip()
    expl = s.index('id="obchat-h"', i)
    btn = s.index('data-sim="">Começar a simulação', s.index('class="ex first"', i))
    top = s.find('obtop" data-sim="">', i)
    top_ok = 0 <= top < expl and bool(re.search(r'@media \(min-width:\s*900px\)\s*\{\s*\.obtop\s*\{\s*display:\s*none', s))
    same = vis == faq['acceptedAnswer']['text']
    before = expl < btn
    qok = faq['name'].replace(' ', '') == h1.replace(' ', '')
    print(f'{oid:14} faq==visivel:{same} explicacao_antes_do_botao:{before} botao_repetido_no_topo(<900px):{top_ok} '
          f'pergunta==H1:{qok} frases:{len(re.findall(r"[.!?](?:\s|$)", vis))}')
    if not same: print('  FAQ:', faq['acceptedAnswer']['text']); print('  VIS:', vis)
    if not qok: print('  Q:', faq['name'], '| H1:', h1, '(só informativo)')
    ok &= same and before and top_ok
print('RESULT', 'PASS' if ok else 'FAIL')
sys.exit(0 if ok else 1)
