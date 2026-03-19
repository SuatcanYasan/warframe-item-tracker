@echo off
setlocal
cd /d "%~dp0"

echo Warframe Craft Tracker masaustu modu baslatiliyor...
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js bulunamadi. Lutfen https://nodejs.org adresinden Node.js LTS yukleyin.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Ilk kurulum yapiliyor...
  call npm install
  if errorlevel 1 goto :fail
)

call npm run desktop
exit /b 0

:fail
echo Islem basarisiz oldu. Lutfen terminal mesajlarini kontrol edin.
pause
exit /b 1

