@echo off
echo Iniciando servidor de administracion...
cd /d "%~dp0"
start /b node server.js
timeout /t 2 >nul
start http://localhost:3000/admin.html
echo Servidor iniciado en http://localhost:3000/admin.html
echo NO CIERRES ESTA VENTANA mientras estes editando satisfactoriamente.
pause
