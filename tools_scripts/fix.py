# -*- coding: utf-8 -*-
import re

path = r'prototipo/android.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

replacements = {
    'VÃaSegura': 'VíaSegura',
    'VaSegura': 'VíaSegura',
    'ðŸ›¡ï¸ ': '🛡️',
    'Y>?': '🛡️',
    'Â¿CÃ³mo': '¿Cómo',
    'Cmo': '¿Cómo',
    'acompaÃ±amiento': 'acompañamiento',
    'acompaamiento': 'acompañamiento',
    'ðŸŽ“': '👨‍🎓',
    'YZ\'': '👨‍🎓',
    'ðŸ‘¨â€ ðŸ‘©â€ ðŸ‘§': '👨‍👩‍👧',
    'Y\'??Y\'??Y\'': '👨‍👩‍👧',
    'Â¿Eres una instituciÃ³n?': '¿Eres una institución?',
    'Eres una institucin?': '¿Eres una institución?',
    'ðŸ «': '🏫',
    'ðŸ“ ': '📍',
    'ðŸ  ': '🏠',
    'ðŸ‘¤': '👤',
    'ðŸš¨': '🚨',
    'ðŸ§‘â€ ðŸ‘¦': '👨‍👦',
    'contraseÃ±a': 'contraseña',
    'contrasea': 'contraseña',
    'electrÃ³nico': 'electrónico',
    'electrnico': 'electrónico',
    'RegÃstrate': 'Regístrate',
    'Regstrate': 'Regístrate',
    'ltima actualizacin': 'Última actualización'
}

for k, v in replacements.items():
    html = html.replace(k, v)

html = re.sub(
    r'<div class="map-placeholder"[^>]*>.*?</div>',
    '<div class="map-placeholder" style="height:250px; margin: -20px -20px 20px; border-radius: 0 0 20px 20px; overflow: hidden;"><img src="mapa_3d.png" style="width:100%; height:100%; object-fit:cover;"></div>',
    html,
    flags=re.DOTALL
)

html = re.sub(r'function initMap.*?}\s*// Estilos CSS', '// Estilos CSS', html, flags=re.DOTALL)
html = re.sub(r'const maps = document.querySelectorAll.*?}\s*}\);', '});', html, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
