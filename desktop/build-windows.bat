@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1

echo ========================================
echo  Notes App - Windows Build Script
echo ========================================
echo.

REM Sprawdzenie czy node jest zainstalowany
echo [SPRAWDZANIE] Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [BLAD] Node.js nie jest zainstalowany!
    echo Pobierz z: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Sprawdzenie czy rust jest zainstalowany
echo [SPRAWDZANIE] Rust...
where rustc >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [BLAD] Rust nie jest zainstalowany!
    echo Pobierz z: https://rustup.rs/
    echo.
    pause
    exit /b 1
)

REM Wyswietl wersje
echo.
echo [OK] Narzedzia zainstalowane:
echo.
for /f "tokens=*" %%i in ('node --version 2^>^&1') do echo   Node.js: %%i
for /f "tokens=*" %%i in ('npm --version 2^>^&1') do echo   npm: %%i
for /f "tokens=*" %%i in ('rustc --version 2^>^&1') do echo   Rust: %%i
echo.

REM Instalacja zaleznosci
echo ========================================
echo  Krok 1: Instalacja zaleznosci...
echo ========================================
echo.
call npm install
if !ERRORLEVEL! NEQ 0 (
    echo.
    echo [BLAD] Instalacja zaleznosci nie powiodla sie!
    echo.
    pause
    exit /b 1
)

REM Build
echo.
echo ========================================
echo  Krok 2: Budowanie instalatora .exe...
echo ========================================
echo.
echo To moze potrwac 10-20 minut przy pierwszym buildzie...
echo Poczekaj az pojawi sie komunikat o zakonczeniu...
echo.
call npm run tauri:build
if !ERRORLEVEL! NEQ 0 (
    echo.
    echo [BLAD] Build nie powiodl sie!
    echo Sprawdz komunikaty bledu powyzej.
    echo.
    pause
    exit /b 1
)

REM Sukces
echo.
echo ========================================
echo  BUILD ZAKONCZONY POMYSLNIE! 
echo ========================================
echo.
echo Twoje instalatory znajduja sie w:
echo.
echo   MSI installer (dla firm):
echo     src-tauri\target\release\bundle\msi\
echo.
echo   EXE installer (zalecane):
echo     src-tauri\target\release\bundle\nsis\
echo.
echo   Portable (bez instalacji):
echo     src-tauri\target\release\Notes Desktop.exe
echo.
echo ========================================
echo.
pause
exit /b 0
