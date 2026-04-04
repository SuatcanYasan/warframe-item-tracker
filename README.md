# Warframe Item Tracker (WIT)

Warframe oyunu için craft, relic ve envanter takip uygulaması. Tarayıcıdan çalışır, verilerin lokalinde tutulur.

## Özellikler

- **Craft Takip Sistemi** — Üretmek istediğin item'ları ekle, gerekli malzemelerin listesini otomatik çıkar, ilerlemeyi takip et
- **Relic Takip Sistemi** — Prime parçaların hangi relic'lerden düştüğünü gör, hangilerini topladığını işaretle
- **Vault** — Envanterdeki prime parçalarını ekle, hangi setleri tamamlayabileceğini gör
- **3 Tema** — Orokin (altın), Drifter (yeşil), Lotus (açık mavi)
- **TR / EN** — Tam çift dil desteği
- **Çift yönlü senkronizasyon** — Craft'ta bir parça tamamlandığında Relic'te de işaretlenir
- **Tema editörü** — Kendi tema renklerini oluştur ve kaydet
- **Offline-first** — Tüm veri tarayıcının localStorage'ında tutulur, kayıt gerekmez

## Hızlı Başlangıç

### Gereksinim
- [Node.js](https://nodejs.org) 18 veya üstü

### Windows
```
start.bat dosyasına çift tıkla
```

### Mac / Linux
```bash
./start.sh
```

İlk çalıştırmada paketler otomatik kurulur ve arayüz derlenir (2-3 dakika). Sonraki açılışlar anında olur.

Tarayıcı otomatik açılır: **http://localhost:3444**

Kapatmak için terminal penceresini kapat ya da `CTRL+C` bas.

## Kullanım

### Craft Takip
1. Sağ üstteki **Ekle** butonuna tıkla
2. Üretmek istediğin item'ı ara (örn: "Mesa Prime")
3. Card'a tıklayarak malzeme listesini gör
4. Her malzeme için sahip olduğun miktarı gir
5. **Toplam Gerekenler** sekmesinden tüm item'lar için ne kadar malzeme eksik gör

### Relic Takip
- Craft'a eklediğin prime'lar otomatik olarak gelir
- Her parçayı topladığında card'a tıklayıp işaretle
- Hangi relic'lerden düştüğünü gör

### Vault (Envanter)
1. **Parça Ekle** ile elindeki parçaları ekle
2. **Setler** sekmesinde hangi setleri tamamlayabileceğini gör
3. Aynı parçadan kaç tane olduğunu gir, kaç set yapabileceğini otomatik hesaplar

## Teknik Detaylar

### Stack
- **Frontend**: React 18 + Vite + Ant Design + Zustand + React Query + Framer Motion
- **Backend**: Express.js + WFCD warframe-items data
- **State**: Zustand stores (persistent via localStorage)
- **Data**: [WFCD warframe-items](https://github.com/WFCD/warframe-items) — otomatik snapshot

### Script'ler
```bash
npm run dev        # Development (hot reload)
npm run build      # Production build (web/dist/)
npm start          # Production server (port 3444)
npm run snapshot   # WFCD data snapshot'ını güncelle
npm test           # Backend test
```

### Port
Varsayılan: `3444`

Değiştirmek için: `PORT=8080 npm start`

### Veri Kaynağı
İlk çalıştırmada WFCD API'sinden Warframe item verileri çekilir ve `data/items.snapshot.json` olarak cache'lenir. Veriler 12 saatte bir güncellenir. İnternet yoksa cache kullanılır.

## Dosya Yapısı

```
warframe-item-tracker/
├── src/                  Backend (Express + services)
│   ├── server.js         API endpoints
│   └── services/
│       ├── itemsService.js
│       └── craftCalculator.js
├── web/
│   ├── src/
│   │   ├── App.jsx              Ana routing
│   │   ├── stores/              Zustand stores
│   │   ├── hooks/               Custom hooks
│   │   ├── components/
│   │   │   ├── shared/          Ortak bileşenler
│   │   │   ├── craft/           Craft Takip
│   │   │   ├── relic/           Relic Takip
│   │   │   └── inventory/       Vault
│   │   ├── styles/              15 modüler CSS
│   │   ├── constants/           i18n, themes
│   │   └── utils/
│   └── dist/                    Production build
├── data/                 Cached WFCD data
├── scripts/              Utility scripts
├── start.bat             Windows başlatıcı
├── start.sh              Mac/Linux başlatıcı
└── package.json
```

## Sorun Giderme

### "Node.js bulunamadı" hatası
https://nodejs.org adresinden LTS sürümü kurun, bilgisayarı yeniden başlatın.

### Port 3444 kullanımda
Başka bir uygulama portu kullanıyor olabilir. `PORT=8080 npm start` ile farklı port kullanın.

### Veriler kayboldu
Veriler tarayıcı localStorage'ında tutulur. Tarayıcı geçmişini temizlediysen veya farklı tarayıcı kullandıysan veriler görünmez. Export/Import butonlarıyla yedek almayı unutma.

### Build hatası
```bash
rm -rf node_modules web/dist
npm install
npm run build
```

## Lisans

Bu proje Warframe oyununa ait değildir, fan made bir araçtır. Item verileri [WFCD](https://github.com/WFCD) tarafından sağlanır.

Warframe ve ilgili tüm tescilli markalar [Digital Extremes](https://www.digitalextremes.com/) firmasına aittir.
