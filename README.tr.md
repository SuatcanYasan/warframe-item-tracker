# Warframe Craft Tracker (Turkce)

Warframe Craft Tracker, Warframe topluluk verisini kullanarak craft gereksinimlerini takip etmenizi saglayan bir masaustu/web uygulamasidir.

- Backend: Express (`src/server.js`)
- Frontend: React + Vite + Ant Design (`web/`)
- Hesaplama: sadece dogrudan tarif (alt craft acilimi yok)

Ingilizce rehber: `README.md`

## Hızlı Baslangic (Ilk Kullanim)

### Secenek A - En Kolay (Windows)

- Web modu icin `KULLAN.bat` dosyasina cift tiklayin.
- Masaustu modu icin `MASAUSTU.bat` dosyasina cift tiklayin.

### Secenek B - Terminal

```powershell
npm install
npm run dev
```

## Ozellikler

- Craft edilebilir item arama ve listeye ekleme
- `Collapse` ile urun bazli detay goruntuleme
- Toplam gereken materyal paneli
- Kismi tamamlama takibi (orn: 2 gerekiyor, 1 tamamlandi, 1 kaldi)
- Tamamlanan miktara gore toplamdan dusme
- Toplam listede durumlar: eksik / kismi / tamam
- Tema presetleri + tam kapsamli tema editoru
- Tema profili kaydet/yukle + JSON disa/ice aktarma
- TR/EN dil destegi
- Klavye kisayollari ve toast bildirimleri
- Ilk acilis sihirbazi

## Calistirma Komutlari

```powershell
npm install
npm run dev
```

```powershell
npm run build
npm start
```

```powershell
npm run desktop
```

```powershell
npm run desktop:pack
```

## Veri Saklama

- Masaustu mod: uygulama durumu Electron `userData` klasorunde JSON olarak saklanir.
- Web mod: tarayici `localStorage` fallback kullanilir.

Bu sayede secilen urunler ve ilerleme bilgileri uygulama kapanip acildiginda korunur.

## API Ozeti

### `GET /api/items?search=<text>&limit=<number>`

Craft recipe'si olan itemlari dondurur.

### `POST /api/calculate`

Istek govdesi:

```json
{
  "items": [{ "uniqueName": "<itemUniqueName>", "quantity": 2 }],
  "expandSubcomponents": false,
  "includeBlueprints": false
}
```

## Kaynak ve Referans

Bu proje, Warframe item verisini WFCD topluluk reposundan kullanir:

- Veri kaynagi: `WFCD/warframe-items`
- URL: `https://github.com/WFCD/warframe-items`

Lisans ve attribution detaylari icin upstream repoyu inceleyin.

