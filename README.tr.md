<div align="center">

<img src="web/public/trackerlogo.png" alt="WIT Logo" width="120" />

# Warframe Item Tracker

**Craft, void relic ve prime parça envanteri için modern, tema duyarlı takip uygulaması.**

[English](./README.md) · [Türkçe](./README.tr.md)

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Ant Design](https://img.shields.io/badge/Ant_Design-5-0170FE?logo=antdesign&logoColor=white)](https://ant.design)
[![Zustand](https://img.shields.io/badge/Zustand-5-443E38)](https://zustand-demo.pmnd.rs)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Node](https://img.shields.io/badge/Node-18+-43853D?logo=node.js&logoColor=white)](https://nodejs.org)
[![Lisans](https://img.shields.io/badge/Lisans-Fan_Made-CA8A04)](#lisans)

<p align="center">
  <img src="docs/screenshot.png" alt="WIT Ekran Görüntüsü" width="820" />
</p>

</div>

---

## İçindekiler

- [Genel Bakış](#genel-bakış)
- [Özellikler](#özellikler)
- [Hızlı Başlangıç](#hızlı-başlangıç)
- [Kullanım](#kullanım)
- [Teknoloji Yığını](#teknoloji-yığını)
- [Proje Yapısı](#proje-yapısı)
- [Script'ler](#scriptler)
- [Sorun Giderme](#sorun-giderme)
- [Yol Haritası](#yol-haritası)
- [Lisans](#lisans)

---

## Genel Bakış

**WIT (Warframe Item Tracker)**, Warframe için hafif, tarayıcı tabanlı bir yardımcı uygulamadır. Neyi craftlamak istediğini, hangi void relic'lerin ihtiyacın olan prime parçaları düşürdüğünü ve envanterinde neyin hazır beklediğini tek bir yerde takip etmene yardım eder — hesap gerektirmez.

Tüm veriler tarayıcının localStorage'ında kalır. Telemetri yok, sunucu tarafında hesap yok, kayıt yok.

---

## Özellikler

| Sayfa | Ne yapıyor |
|-------|------------|
| **Craft Takip Sistemi** | Üretmek istediğin item'ları ekle, her kaynak gereksinimini gör, topladıkça malzemeleri işaretle, genel ilerlemeyi takip et |
| **Relic Takip Sistemi** | Her prime parçayı hangi void relic'lerin düşürdüğünü gör, bulunan bileşenleri işaretle, Craft Takip ile otomatik senkronize olur |
| **Vault** | Sahip olduğun tek tek prime parçaları ekle, hangi setleri tamamlayabileceğini gör, kaç set yapılabileceğini otomatik hesaplar |

### Ek Yetenekler

- **Üç tema** — Orokin (altın), Drifter (yeşil), Lotus (açık mavi) — her UI öğesi dinamik olarak uyum sağlar
- **Tema editörü** — Kendi renk şemanı oluştur, birden fazla profil kaydet, JSON olarak dışa/içe aktar
- **İki dilli** — Anında dil geçişi ile tam Türkçe ve İngilizce desteği
- **Çift yönlü senkronizasyon** — Craft Takip'te bir parçayı tamamla, Relic Takip'te otomatik bulunmuş işaretlenir
- **Fuzzy arama** — Yazım hataları sorun değil (Fuse.js ile)
- **İçe/Dışa aktarma** — Verini JSON olarak yedekle, cihazlar arası taşı
- **Offline-first** — İlk yüklemeden sonra internet olmadan çalışır (WFCD verisi cache'lenir)
- **Kurulum yok** — Sadece tarayıcı ve Node.js yeterli

---

## Hızlı Başlangıç

### Gereksinimler

- [Node.js 18+](https://nodejs.org) — LTS önerilir

### Windows

**`start.bat`** dosyasına çift tıkla

### macOS / Linux

```bash
./start.sh
```

İlk çalıştırmada script şunları yapar:
1. npm paketlerini kurar (2-3 dakika)
2. Arayüzü derler
3. Backend server'ı başlatır
4. Tarayıcında **http://localhost:3444** adresini açar

Sonraki açılışlar anında olur. Durdurmak için terminalde `CTRL+C` bas.

---

## Kullanım

### Craft Takip Sistemi

1. Sağ üstteki **Ekle** butonuna tıkla
2. Bir item ara (örn: *"Mesa Prime"*)
3. Card'a tıklayıp gereksinimlerini gör
4. Her malzeme için sahip olduğun miktarı gir
5. **Toplam Gerekenler** sekmesi tüm takip edilen item'ların toplam malzemelerini gösterir

### Relic Takip Sistemi

- Craft Takip'e eklediğin prime item'lar burada otomatik görünür
- Bir card'a tıklayıp her bileşeni hangi relic'lerin düşürdüğünü gör
- Bileşenleri bulundu olarak işaretle — Craft Takip eşzamanlı güncellenir

### Vault

1. **Parça Ekle** drawer'ını aç
2. Tek tek prime bileşenleri ara (örn: *"Ash Neuroptics"*)
3. Miktarı gir
4. **Setler** sekmesine geçip hangi tam prime setlerini yapabileceğini gör

---

## Teknoloji Yığını

### Frontend
- **[React 18](https://react.dev)** — UI framework
- **[Vite 5](https://vitejs.dev)** — Build tool & dev server
- **[Ant Design 5](https://ant.design)** — Bileşen kütüphanesi
- **[Zustand](https://zustand-demo.pmnd.rs)** — State yönetimi (4 store, Redux boilerplate'i yok)
- **[Immer](https://immerjs.github.io/immer/)** — Immutable state güncellemeleri
- **[React Query](https://tanstack.com/query)** — API cache & veri çekme
- **[React Router 7](https://reactrouter.com)** — Client-side routing
- **[Framer Motion](https://www.framer.com/motion/)** — Animasyonlar
- **[Fuse.js](https://fusejs.io)** — Fuzzy arama

### Backend
- **[Express](https://expressjs.com)** — HTTP server & API
- **[WFCD warframe-items](https://github.com/WFCD/warframe-items)** — Resmi Warframe verisi
- **[Node.js 18+](https://nodejs.org)** — Runtime

---

## Proje Yapısı

```
warframe-item-tracker/
├── src/                          Backend
│   ├── server.js                 Express API
│   └── services/
│       ├── itemsService.js       WFCD data loader + arama
│       └── craftCalculator.js    Gereksinim çözücü
├── web/
│   ├── src/
│   │   ├── App.jsx               Kök + routing
│   │   ├── stores/               Zustand store'lar (4 adet)
│   │   ├── hooks/                Custom hook'lar
│   │   ├── components/
│   │   │   ├── shared/           AppHeader, Sidebar, Drawer'lar
│   │   │   ├── craft/            Craft Tracker sayfaları
│   │   │   ├── relic/            Relic Tracker sayfaları
│   │   │   └── inventory/        Vault sayfaları & tab'lar
│   │   ├── styles/               15 modüler CSS dosyası
│   │   ├── constants/            i18n, temalar
│   │   └── utils/                helper'lar, storage, queryClient
│   └── dist/                     Production build (üretilir)
├── data/                         Cache'lenmiş WFCD snapshot
├── start.bat                     Windows başlatıcı
├── start.sh                      macOS/Linux başlatıcı
└── package.json
```

---

## Script'ler

```bash
npm run dev        # Eş zamanlı backend + Vite dev server (hot reload)
npm run build      # Production build → web/dist/
npm start          # Production server'ı 3444 portunda başlat
npm run snapshot   # Son WFCD verisini çek
npm test           # Backend testleri
```

### Ortam Değişkenleri

| Değişken | Varsayılan | Amaç |
|----------|-----------|------|
| `PORT` | `3444` | HTTP server portu |

---

## Sorun Giderme

<details>
<summary><b>"Node.js bulunamadı" hatası</b></summary>

https://nodejs.org adresinden Node.js 18+ sürümünü kur. Kurulumdan sonra terminali veya bilgisayarı yeniden başlat.
</details>

<details>
<summary><b>3444 portu kullanımda</b></summary>

Başka bir uygulama portu kullanıyor. Farklı port ile çalıştır:
```bash
PORT=8080 npm start
```
</details>

<details>
<summary><b>Takip ettiğim item'lar kayboldu</b></summary>

Tüm veriler tarayıcının localStorage'ında tutulur. Şu durumlarda kaybolur: tarayıcı geçmişini/cache'ini temizlemek, farklı tarayıcıya geçmek, incognito/gizli mod kullanmak. **Dışa Aktar** butonunu düzenli kullanarak verini yedekle.
</details>

<details>
<summary><b>git pull sonrası build başarısız</b></summary>

```bash
rm -rf node_modules web/dist
npm install
npm run build
```
</details>

---

## Yol Haritası

- [ ] PWA desteği (desktop app olarak kurulum)
- [ ] Farm Planner sayfası (kaynak farmı için misyon planlaması)
- [ ] URL ile tracker durumu paylaşma
- [ ] Sürükle-bırak item sıralama
- [ ] İlerlemeyi görsel/PDF olarak dışa aktarma

---

## Lisans

Bu bir **fan-made** yardımcı uygulamadır. Digital Extremes ile bir bağlantısı yoktur, tarafından onaylanmamıştır.

- Warframe item verileri [Warframe Community Developers (WFCD)](https://github.com/WFCD) tarafından kendi lisansları altında sağlanır.
- Warframe, Warframe logosu ve tüm ilgili tescilli markalar [Digital Extremes Ltd.](https://www.digitalextremes.com/) firmasına aittir.
- Kaynak kod kişisel amaçlarla serbestçe kullanılıp değiştirilebilir.

---

<div align="center">

**Tenno topluluğu için özenle yapıldı**

[⬆ Başa dön](#warframe-item-tracker)

</div>
