#!/bin/bash
set -e
cd "$(dirname "$0")"

echo ""
echo "========================================"
echo "   Warframe Item Tracker (WIT)"
echo "========================================"
echo ""

# --- Node.js kurulu mu kontrol et ---
if ! command -v node >/dev/null 2>&1; then
    echo "[HATA] Node.js bulunamadı."
    echo ""
    echo "Lütfen önce Node.js kurun: https://nodejs.org"
    echo "Kurduktan sonra bu dosyayı tekrar çalıştırın."
    echo ""
    exit 1
fi

# --- node_modules yoksa paketleri kur ---
if [ ! -d "node_modules" ]; then
    echo "[1/3] Paketler kuruluyor, bu ilk açılışta biraz sürebilir..."
    npm install
    echo ""
fi

# --- Frontend build yoksa oluştur ---
if [ ! -f "web/dist/index.html" ]; then
    echo "[2/3] Arayüz derleniyor..."
    npm run build
    echo ""
fi

# --- Server'ı başlat ---
echo "[3/3] Server başlatılıyor..."
echo ""
echo "   URL: http://localhost:3444"
echo ""
echo "   Kapatmak için CTRL+C basın."
echo ""

# 3 saniye sonra tarayıcıyı aç
(
    sleep 3
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open http://localhost:3444
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:3444 2>/dev/null || true
    fi
) &

# Server'ı başlat
node src/server.js
