import re

with open('prototipo/android.html', 'r', encoding='utf-8') as f:
    content = f.read()

recorrido_replacement = '''        <div class="map-placeholder" style="height:250px; margin: -20px -20px 20px; border-radius: 0 0 20px 20px;"></div>
        <div style="background:var(--surface); border-radius:12px; padding:16px; margin-bottom:16px; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid var(--border); margin-top:-40px; position:relative; z-index:1000;">
          <div style="display:flex; justify-content:space-between; margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid var(--border);">
            <div><div style="font-size:11px; color:var(--text-muted);">Coordenadas GPS</div><div style="font-size:13px; font-weight:700;">-16.4080 S, -71.5350 W</div></div>
            <div style="text-align:right;"><div style="font-size:11px; color:var(--text-muted);">Actualizado</div><div style="font-size:13px; font-weight:700;">Hace 2 min</div></div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div><div style="font-size:11px; color:var(--text-muted);">Geocerca de Seguridad</div><div style="font-size:13px; font-weight:700; color:var(--success);">Activa (Radio: 500m)</div></div>
            <button class="btn btn-outline btn-sm" style="width:auto; padding:6px 12px; font-size:11px;">Ajustar</button>
          </div>
        </div>
        
        <div class="route-info">
          <div class="route-info-item"><div class="route-info-value">18 min</div><div class="route-info-label">Transcurrido</div></div>
          <div class="route-info-item"><div class="route-info-value" style="color:var(--success);">Normal</div><div class="route-info-label">Estado</div></div>
        </div>
        
        <div style="display:flex; gap:10px; margin-bottom:16px;">
          <button class="btn btn-danger" style="flex:1; background:#EF4444; border:none; padding:12px;">?? Modo Emergencia</button>
          <button class="btn btn-primary" style="flex:1; padding:12px;"> FINALIZAR</button>
        </div>'''

padre_replacement = '''        <div class="map-placeholder" style="height:250px; margin: 16px -20px 20px;"></div>
        <div style="background:var(--surface); border-radius:12px; padding:16px; margin-bottom:16px; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid var(--border); margin-top:-40px; position:relative; z-index:1000;">
          <div style="display:flex; justify-content:space-between; margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid var(--border);">
            <div><div style="font-size:11px; color:var(--text-muted);">Coordenadas GPS</div><div style="font-size:13px; font-weight:700;">-16.4080 S, -71.5350 W</div></div>
            <div style="text-align:right;"><div style="font-size:11px; color:var(--text-muted);">Actualizado</div><div style="font-size:13px; font-weight:700;">Hace 2 min</div></div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div><div style="font-size:11px; color:var(--text-muted);">Geocerca de Seguridad</div><div style="font-size:13px; font-weight:700; color:var(--success);">Activa (Radio: 500m)</div></div>
            <button class="btn btn-outline btn-sm" style="width:auto; padding:6px 12px; font-size:11px;">Ajustar</button>
          </div>
        </div>
        
        <div class="route-info">
          <div class="route-info-item"><div class="route-info-value">18 min</div><div class="route-info-label">Transcurrido</div></div>
          <div class="route-info-item"><div class="route-info-value" style="color:var(--success);">Normal</div><div class="route-info-label">Estado</div></div>
        </div>
        <p class="body-sm" style="margin-bottom:12px; text-align:center;">ltima actualizacin hace 10 segundos</p>
        <div style="display:flex; gap:10px; margin-bottom:24px;">
          <button class="btn btn-danger" style="flex:1; background:#EF4444; border:none;">?? MODO EMERGENCIA</button>
          <button class="btn btn-outline" style="flex:1; background:transparent; border:2px solid var(--border); color:var(--text);">?? CONTACTAR</button>
        </div>'''


# For #recorrido
content = re.sub(
    r'<div class="map-placeholder" style="height:170px;">.*?<button class="emergency-btn">??<br>EMERGENCIA</button>',
    recorrido_replacement.replace('??', '??').replace('', '¦'),
    content,
    flags=re.DOTALL
)

# For #padre
content = re.sub(
    r'<div class="map-placeholder" style="height:170px; margin-top:16px;">.*?<button class="btn btn-outline".*?CONTACTAR</button>\s*</div>',
    padre_replacement.replace('??', '??').replace('', 'Ú'),
    content,
    flags=re.DOTALL
)

# Also update the initMap script to draw the circle
geofence_code = '''
            // Trazar ruta simple (lnea)
            const route = L.polyline([colegioArequipa, gpsAlumno, casaAlumno], {
                color: '#1B4E9B', weight: 4, dashArray: '5, 10'
            }).addTo(map);
            
            // Geocerca (Crculo rojo de 500m)
            L.circle(colegioArequipa, {
                color: '#EF4444',
                fillColor: '#EF4444',
                fillOpacity: 0.1,
                radius: 500
            }).addTo(map);
'''

content = content.replace('''            // Trazar ruta simple (línea)
            const route = L.polyline([colegioArequipa, gpsAlumno, casaAlumno], {
                color: '#1B4E9B', weight: 4, dashArray: '5, 10'
            }).addTo(map);''', geofence_code.replace('', 'í'))

with open('prototipo/android.html', 'w', encoding='utf-8') as f:
    f.write(content)
