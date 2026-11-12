import re

path = r'prototipo\android.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

# Fix common mojibake manually because decoding failed due to BOM/multiple passes
replacements = {
    'VaSegura': 'VíaSegura',
    'VÃaSegura': 'VíaSegura',
    'Y>?': '???',
    'ğŸ’': '???',
    'Acompaando': 'Acompañando',
    'acompaÃ±amiento': 'acompañamiento',
    'Cmo': '¿Cómo',
    'Â¿CÃ³mo': '¿Cómo',
    'YZ\'': '?????',
    'ğŸ\'': '?????',
    'Y\'??Y\'??Y\'': '????????',
    'ğŸ‘¨â€ğŸ‘©â€ğŸ‘§': '????????',
    'Eres una institucin?': '¿Eres una institución?',
    'Â¿Eres una instituciÃ³n?': '¿Eres una institución?',
    'Y?': '??',
    '????????': '••••••••',
    'Olvidaste tu contrasea?': '¿Olvidaste tu contraseña?',
    'Regstrate': 'Regístrate',
    'Contrasea': 'Contraseña',
    'Seleccin': 'Selección',
    'electrnico': 'electrónico',
    'Y-?': '??',
    'Y\'': '??',
    '-?': '?',
    '-': '¦',
    'Ys': '??',
    'YY': '??',
    's?': '??',
    'ltima actualizacin': 'Última actualización'
}

for k, v in replacements.items():
    html = html.replace(k, v)

# Replace Map in Recorrido and Padre
html = re.sub(
    r'<div class="map-placeholder"[^>]*>.*?</div>',
    '<div class="map-placeholder" style="height:250px; margin: -20px -20px 20px; border-radius: 0 0 20px 20px; overflow: hidden;"><img src="mapa_3d.png" style="width:100%; height:100%; object-fit:cover;"></div>',
    html,
    flags=re.DOTALL
)

# Remove leaflet initMap script
html = re.sub(r'function initMap.*?}\s*// Estilos CSS', '// Estilos CSS', html, flags=re.DOTALL)
html = re.sub(r'const maps = document.querySelectorAll.*?}\s*}\);', '});', html, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
