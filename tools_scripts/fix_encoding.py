import os

path = r'prototipo\android.html'
try:
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Intenta revertir la doble codificacion
    fixed_text = text.encode('cp1252').decode('utf-8')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(fixed_text)
    print("Fix applied successfully.")
except Exception as e:
    print("Error:", e)
