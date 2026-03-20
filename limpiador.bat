@echo off
title Liberador de Espacio Temporal
color 0A
echo ==================================================
echo      LIMPIANDO ARCHIVOS TEMPORALES DEL SISTEMA
echo ==================================================
echo.
echo Cerrando explorador para evitar bloqueos...
echo.

:: 1. Limpiar carpeta TEMP del Usuario actual
echo [1/2] Limpiando carpeta Temp de Usuario (%TEMP%)...
del /q /f /s "%TEMP%\*" 2>nul
for /d %%x in ("%TEMP%\*") do @rd /s /q "%%x" 2>nul

:: 2. Limpiar carpeta TEMP de Windows (Requiere permisos de Admin)
echo [2/2] Limpiando carpeta Temp de Windows (C:\Windows\Temp)...
del /q /f /s "C:\Windows\Temp\*" 2>nul
for /d %%x in ("C:\Windows\Temp\*") do @rd /s /q "%%x" 2>nul

echo.
echo ==================================================
echo             LIMPIEZA FINALIZADA
echo   (Los archivos en uso no fueron eliminados)
echo ==================================================
echo.
pause
