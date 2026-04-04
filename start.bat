@echo off
setlocal
title Warframe Item Tracker
cd /d "%~dp0"

echo.
echo ========================================
echo   Warframe Item Tracker (WIT)
echo ========================================
echo.

REM --- Node.js kurulu mu kontrol et ---
where node >nul 2>nul
if errorlevel 1 (
    echo [HATA] Node.js bulunamadi.
    echo.
    echo Lutfen once Node.js kurun: https://nodejs.org
    echo Kurduktan sonra bu dosyayi tekrar calistirin.
    echo.
    pause
    exit /b 1
)

REM --- node_modules yok ise paketleri kur ---
if not exist "node_modules" (
    echo [1/3] Paketler kuruluyor, bu ilk acilista biraz surebilir...
    call npm install
    if errorlevel 1 (
        echo [HATA] Paket kurulumu basarisiz oldu.
        pause
        exit /b 1
    )
    echo.
)

REM --- Frontend build yok ise olustur ---
if not exist "web\dist\index.html" (
    echo [2/3] Arayuz derleniyor...
    call npm run build
    if errorlevel 1 (
        echo [HATA] Build basarisiz oldu.
        pause
        exit /b 1
    )
    echo.
)

REM --- Server'i baslat ---
echo [3/3] Server baslatiliyor...
echo.
echo   URL: http://localhost:3444
echo.
echo   Kapatmak icin bu pencereyi kapatın veya CTRL+C basın.
echo.

REM 3 saniye bekle, sonra tarayiciyi ac
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3444"

REM Server'i baslat
node src/server.js

pause
endlocal
