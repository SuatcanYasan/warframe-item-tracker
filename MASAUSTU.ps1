Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Set-Location -Path $PSScriptRoot
Write-Host "Warframe Craft Tracker masaustu modu baslatiliyor..."

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js bulunamadi. Lutfen https://nodejs.org adresinden Node.js LTS yukleyin."
  Read-Host "Cikmak icin Enter"
  exit 1
}

if (-not (Test-Path "node_modules")) {
  Write-Host "Ilk kurulum yapiliyor..."
  npm install
}

npm run desktop

