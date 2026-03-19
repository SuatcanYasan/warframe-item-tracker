Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Set-Location -Path $PSScriptRoot
Write-Host "Warframe Craft Tracker baslatiliyor..."

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js bulunamadi. Lutfen https://nodejs.org adresinden Node.js LTS yukleyin."
  Read-Host "Cikmak icin Enter"
  exit 1
}

if (-not (Test-Path "node_modules")) {
  Write-Host "Ilk kurulum yapiliyor..."
  npm install
}

if (-not (Test-Path "web/dist/index.html")) {
  Write-Host "Arayuz derleniyor..."
  npm run build
}

Start-Process "http://localhost:3000"
npm start

