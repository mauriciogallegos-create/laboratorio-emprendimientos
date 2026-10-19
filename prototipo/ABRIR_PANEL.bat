@echo off
rem Abre el panel web en http://localhost para que funcione la camara del equipo
rem (laptop, celular o tablet). Doble clic a este archivo y listo.
cd /d "%~dp0"
start "" /min cmd /c "node servidor_local.js 8080"
timeout /t 2 >nul
start "" "http://localhost:8080/web.html"
