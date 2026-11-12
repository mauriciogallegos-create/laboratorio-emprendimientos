import os

path = r'prototipo\android.html'
try:
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    if text.startswith('\ufeff'):
        text = text[1:]
        
    fixed_text = text.encode('cp1252', errors='ignore').decode('utf-8', errors='ignore')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(fixed_text)
    print("Fix applied successfully.")
except Exception as e:
    print("Error:", e)
