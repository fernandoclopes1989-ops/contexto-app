@echo off
title Contexto - Estudo de Ingles
echo.
echo  ========================================
echo    Contexto - Estudo de Ingles
echo  ========================================
echo.
echo  Iniciando o app...
echo  Para fechar, feche esta janela.
echo.
where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    python "%~dp0launch.py"
) else (
    py "%~dp0launch.py"
)
pause
