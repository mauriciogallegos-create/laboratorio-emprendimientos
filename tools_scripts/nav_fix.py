import re

path = r'prototipo/android.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

new_script = """// Attach clicks to simulate user flow
document.addEventListener('DOMContentLoaded', () => {
    // Helper to safely add click listener
    const click = (selector, target) => {
        document.querySelectorAll(selector).forEach(el => {
            el.style.cursor = 'pointer';
            el.onclick = (e) => { e.preventDefault(); goToScreen(target); };
        });
    };

    // Flow Principal
    click('#rol .card:nth-child(1)', 'login'); // Soy Estudiante -> Login
    click('#rol .card:nth-child(2)', 'padre'); // Soy Apoderado -> Padre
    click('#login .btn-primary', 'home');      // Ingresar -> Home
    
    // Home Estudiante: Botones Centrales
    click('#home .btn-primary', 'recorrido');  // Iniciar Recorrido -> Recorrido
    click('#home .card[style*="width:30%"]:nth-child(1)', 'recorrido'); // Mi Ruta
    click('#home .card[style*="width:30%"]:nth-child(2)', 'puntos');    // Puntos seguros
    click('#home .card[style*="width:30%"]:nth-child(3)', 'incidencia');// Reportar
    
    // Home Estudiante: Boton Emergencia (medio circulo)
    click('#home .emergency-home-btn', 'emergencia');
    click('#home .btn-danger', 'emergencia'); // fallback

    // Recorrido
    click('#recorrido .btn-primary', 'home');  // Finalizar -> Home
    click('#recorrido .btn-danger', 'emergencia'); // Emergencia

    // Emergencia / Enviada
    click('#emergencia .btn-danger', 'enviada');
    click('#emergencia .btn-outline', 'recorrido');
    click('#enviada .btn-primary', 'home');

    // Padre flow
    click('#padre .btn-danger', 'padre-alerta');
    click('#padre-alerta .btn-outline', 'padre');

    // BOTTOM NAV BAR (Universal para Estudiante)
    // El primer item es "Inicio", el segundo "Ruta", el tercero "Seguros", cuarto "Perfil"
    click('.bottom-nav a:nth-child(1)', 'home');
    click('.bottom-nav a:nth-child(2)', 'recorrido');
    click('.bottom-nav a:nth-child(3)', 'puntos');
    click('.bottom-nav a:nth-child(4)', 'home'); // Placeholder perfil
});
</script>"""

# Replace the existing DOMContentLoaded block
html = re.sub(
    r"// Attach clicks to simulate user flow.*?</script>",
    new_script,
    html,
    flags=re.DOTALL
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
