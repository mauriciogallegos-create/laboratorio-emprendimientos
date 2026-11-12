text = 'VÃaSegura'
try:
    fixed = text.encode('cp1252').decode('utf-8')
    print(fixed)
except Exception as e:
    print('Error:', e)
