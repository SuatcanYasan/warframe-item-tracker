# Warframe Craft Tracker

Warframe Craft Tracker is a desktop/web app for planning crafting requirements using data from the Warframe community dataset.

- Backend: Express (`src/server.js`)
- Frontend: React + Vite + Ant Design (`web/`)
- Calculation mode: direct recipe only (no recursive sub-craft expansion)

Turkish guide: see `README.tr.md`.

## Quick Start (First-Time User)

### Option A - Easiest (Windows)

- Double-click `KULLAN.bat` for web mode.
- Double-click `MASAUSTU.bat` for desktop app mode.

### Option B - Terminal

```powershell
npm install
npm run dev
```

## Features

- Search and add craftable items
- Item-based details with `Collapse`
- Total required materials panel
- Partial completion tracking (for example: need 2, completed 1, remaining 1)
- Totals decrease as requirements are marked completed
- Status display in totals: open / partial / completed
- Theme presets + full custom theme editor
- Theme profile save/load + JSON export/import
- TR/EN language support
- Keyboard shortcuts and toast notifications
- First-run wizard

## Run Commands

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

## Data Persistence

- Desktop mode: app state is saved as JSON in Electron `userData` directory.
- Web mode: app state falls back to browser `localStorage`.

This keeps selected items and progress after closing/reopening the app.

## API Summary

### `GET /api/items?search=<text>&limit=<number>`

Returns craftable items.

### `POST /api/calculate`

Request body:

```json
{
  "items": [{ "uniqueName": "<itemUniqueName>", "quantity": 2 }],
  "expandSubcomponents": false,
  "includeBlueprints": false
}
```

## Credits / Attribution

This project uses Warframe item data from the WFCD community repository:

- Data source: `WFCD/warframe-items`
- URL: `https://github.com/WFCD/warframe-items`

Please review the upstream repository for license and attribution details.






