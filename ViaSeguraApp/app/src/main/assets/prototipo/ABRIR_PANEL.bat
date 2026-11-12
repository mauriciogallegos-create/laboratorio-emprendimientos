@echo off
rem ═══════════════════════════════════════════════════════════════
rem  VíaSegura — Servidor Local
rem  Abre el panel web y permite que el celular envíe reportes.
rem  Doble clic a este archivo y listo.
rem ═══════════════════════════════════════════════════════════════
cd /d "%~dp0"

echo.
echo  Iniciando servidor ViaSegura...
echo  ─────────────────────────────────
echo.

rem Obtener la IP local para mostrarla
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
    set "IP=%%a"
    goto :found
)
:found
set IP=%IP: =%

echo  LAPTOP  (Panel Web):  http://localhost:8080/web.html
echo  CELULAR (App Android): http://%IP%:8080/android.html
echo.
echo  Ambos deben estar en la misma red Wi-Fi.
echo  Presiona Ctrl+C para cerrar el servidor.
echo.

start "" "http://localhost:8080/web.html"
node servidor_local.js 8080
pause
