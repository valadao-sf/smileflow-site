# Gera de novo a Inter do simulador (public/simulador-objecoes/assets/fonts/inter-{normal,italic}.woff2).
# Uso: python3 tools/simulador-objecoes/fonts.py   (precisa de internet, fontTools e brotli)
#
# O arquivo leva só os caracteres que o motor usa (mais o latim básico e os acentos do português, para nomes
# digitados), os pesos 400 a 800 e o eixo de tamanho óptico (14 a 32). Fica com uns 45 KB por estilo.
# Rode de novo quando o texto do motor ganhar um caractere novo (um símbolo, outra língua).
import os, re, string, subprocess, tempfile, urllib.parse
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'public', 'simulador-objecoes', 'assets', 'fonts')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36'

eng = open(os.path.join(HERE, 'engine.html'), encoding='utf-8').read()
extra = set(string.printable.strip()) | set('áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ“”‘’–—…•·×÷°ºª§¿¡€£¢')
chars = ''.join(sorted((set(c for c in eng if ord(c) >= 32 and not c.isspace()) | extra) - {'​', '﻿'}))

css_url = ('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400..800;1,14..32,400..800'
           '&display=swap&text=' + urllib.parse.quote(chars, safe=''))
css = subprocess.run(['curl', '-s', '--max-time', '30', '-A', UA, css_url], check=True, capture_output=True, text=True).stdout
files = re.findall(r"font-style: (\w+);.*?src: url\(([^)]+)\)", css, re.S)
assert len(files) == 2, css[:300]
os.makedirs(OUT, exist_ok=True)
for style, url in files:
    name = 'italic' if style == 'italic' else 'normal'
    with tempfile.NamedTemporaryFile(suffix='.woff2') as tmp:
        subprocess.run(['curl', '-s', '--max-time', '60', '-o', tmp.name, url], check=True)
        font = instancer.instantiateVariableFont(TTFont(tmp.name), {'wght': (400, 800)})
    cmap = font.getBestCmap()
    missing = [c for c in chars if c != ' ' and ord(c) not in cmap]
    assert not missing, f'faltam caracteres na Inter {name}: {"".join(missing)}'
    font.flavor = 'woff2'
    dest = os.path.join(OUT, f'inter-{name}.woff2')
    font.save(dest)
    print(name, os.path.getsize(dest) // 1024, 'KB', [(a.axisTag, a.minValue, a.maxValue) for a in font['fvar'].axes])
