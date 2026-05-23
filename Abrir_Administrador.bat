@echo off
:: Cambiamos a la ruta del script para evitar errores de directorios incorrectos o de OneDrive
cd /d "%~dp0"

echo ==========================================================
echo    INICIANDO PANEL DE ADMINISTRACION (Protocolo-Recep)
echo    Ruta: %cd%
echo ==========================================================
echo.

:: Verificamos Node
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] No se encuentra Node.js. Por favor instalalo.
    pause
    exit
)

:: 3. Iniciar el servidor de Node.js
:: Usamos 'node server.js' directamente para ver los logs en esta ventana.
echo [INFO] Iniciando servidor en el puerto 3001...
echo [INFO] Abriendo navegador en:
echo   - http://localhost:3001/admin.html
echo   - http://localhost:3001/index.html
start http://localhost:3001/admin.html
start http://localhost:3001/index.html
node server.js

:: Si se cierra, dejamos la ventana abierta para ver el error
echo.
echo [AVISO] El servidor se ha detenido.
pause
