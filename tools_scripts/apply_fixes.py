import re

# FIX ANDROID.HTML (Grid issue on map and clicking behavior)
path = r'prototipo/android.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

# Fix the grid showing over the image by ensuring the img covers it and map-placeholder has no background
html = html.replace(
    '<div class="map-placeholder" style="height:250px; margin: -20px -20px 20px; border-radius: 0 0 20px 20px; overflow: hidden;">',
    '<div class="map-placeholder" style="height:250px; margin: -20px -20px 20px; border-radius: 0 0 20px 20px; overflow: hidden; background: none; border: none;">'
)
html = html.replace(
    '<div class="map-placeholder" style="height:250px; margin: 16px -20px 20px;">',
    '<div class="map-placeholder" style="height:250px; margin: 16px -20px 20px; background: none; border: none; overflow: hidden; border-radius: 12px;">'
)

# Ensure goToScreen scrolls smoothly if not in presentation mode
html = html.replace(
    "window.location.hash = id;",
    "document.getElementById(id).scrollIntoView({behavior: 'smooth', block: 'center'});"
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)

# FIX WEB.HTML (API KEY REQUIRED error on tiles)
path_web = r'prototipo/web.html'
with open(path_web, 'r', encoding='utf-8') as f:
    web = f.read()

# Replace CartoDB URL with standard OSM to remove the "API KEY REQUIRED" watermark
web = web.replace(
    "'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'",
    "'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'"
)

with open(path_web, 'w', encoding='utf-8') as f:
    f.write(web)
