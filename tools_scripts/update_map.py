import os

path = r'prototipo\android.html'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

target = "const route = L.polyline([colegioArequipa, gpsAlumno, casaAlumno], {\n                color: '#1B4E9B', weight: 4, dashArray: '5, 10'\n            }).addTo(map);"

replacement = """const route = L.polyline([colegioArequipa, gpsAlumno, casaAlumno], {
                color: '#1B4E9B', weight: 4, dashArray: '5, 10'
            }).addTo(map);

            // Geocerca (Circulo de 500m) basado en el nuevo diseno MediCase
            L.circle(colegioArequipa, {
                color: '#EF4444',
                fillColor: '#EF4444',
                fillOpacity: 0.1,
                radius: 500
            }).addTo(map);"""

new_text = text.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_text)

