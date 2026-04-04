<div align="center">

<img src="web/public/trackerlogo.png" alt="WIT Logo" width="120" />

# Warframe Item Tracker

**A modern, theme-aware tracker for Warframe crafting, void relics, and prime part inventory.**

[English](./README.md) · [Türkçe](./README.tr.md)

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Ant Design](https://img.shields.io/badge/Ant_Design-5-0170FE?logo=antdesign&logoColor=white)](https://ant.design)
[![Zustand](https://img.shields.io/badge/Zustand-5-443E38)](https://zustand-demo.pmnd.rs)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Node](https://img.shields.io/badge/Node-18+-43853D?logo=node.js&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-Fan_Made-CA8A04)](#license)

<p align="center">
  <img src="docs/screenshot.png" alt="WIT Screenshot" width="820" />
</p>

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

**WIT (Warframe Item Tracker)** is a lightweight, browser-based companion app for Warframe. It helps you keep track of what you want to craft, which void relics drop the prime parts you need, and what's already sitting in your vault — all in one place, with zero account required.

All data stays in your browser's localStorage. No telemetry, no server-side accounts, no sign-ups.

---

## Features

| Page | What it does |
|------|--------------|
| **Craft Tracking System** | Add items you want to build, see every resource requirement, mark materials as you collect them, track overall progress |
| **Relic Tracking System** | View which void relics drop each prime part, mark components as found, auto-syncs with Craft Tracker |
| **Vault** | Add individual prime parts you own, see which sets you can complete, calculates how many craftable sets you have |

### Additional Capabilities

- **Three themes** — Orokin (gold), Drifter (green), Lotus (light blue) — every UI element adapts dynamically
- **Theme editor** — Build your own color scheme, save multiple profiles, export/import as JSON
- **Bilingual** — Full Turkish and English support with instant language switching
- **Bidirectional sync** — Complete a part in Craft Tracker, it's marked found in Relic Tracker automatically
- **Fuzzy search** — Typos welcome (powered by Fuse.js)
- **Import/Export** — Backup your data as JSON, restore across devices
- **Offline-first** — Works without internet after first load (WFCD data cached)
- **No install needed** — Just a browser and Node.js

---

## Quick Start

### Prerequisites

- [Node.js 18+](https://nodejs.org) — LTS recommended

### Windows

Double-click **`start.bat`**

### macOS / Linux

```bash
./start.sh
```

On first launch, the script will:
1. Install npm packages (2-3 minutes)
2. Build the frontend
3. Start the backend server
4. Open your browser at **http://localhost:3444**

Subsequent launches are instant. Press `CTRL+C` in the terminal to stop.

---

## Usage

### Craft Tracking System

1. Click **Add** in the top-right
2. Search for an item (e.g. *"Mesa Prime"*)
3. Click the card to see its requirements
4. Enter how much of each material you own
5. The **Total Requirements** tab shows aggregate materials across all tracked items

### Relic Tracking System

- Prime items added in Craft Tracker appear here automatically
- Click a card to see which relics drop each component
- Mark components as found — Craft Tracker updates in sync

### Vault

1. Open the **Add Part** drawer
2. Search for individual prime components (e.g. *"Ash Neuroptics"*)
3. Enter quantity
4. Switch to the **Sets** tab to see which complete prime sets you can build

---

## Tech Stack

### Frontend
- **[React 18](https://react.dev)** — UI framework
- **[Vite 5](https://vitejs.dev)** — Build tool & dev server
- **[Ant Design 5](https://ant.design)** — Component library
- **[Zustand](https://zustand-demo.pmnd.rs)** — State management (4 stores, no Redux boilerplate)
- **[Immer](https://immerjs.github.io/immer/)** — Immutable state updates
- **[React Query](https://tanstack.com/query)** — API cache & data fetching
- **[React Router 7](https://reactrouter.com)** — Client-side routing
- **[Framer Motion](https://www.framer.com/motion/)** — Animations
- **[Fuse.js](https://fusejs.io)** — Fuzzy search

### Backend
- **[Express](https://expressjs.com)** — HTTP server & API
- **[WFCD warframe-items](https://github.com/WFCD/warframe-items)** — Authoritative Warframe data
- **[Node.js 18+](https://nodejs.org)** — Runtime

---

## Project Structure

```
warframe-item-tracker/
├── src/                          Backend
│   ├── server.js                 Express API
│   └── services/
│       ├── itemsService.js       WFCD data loader + search
│       └── craftCalculator.js    Requirement resolver
├── web/
│   ├── src/
│   │   ├── App.jsx               Root + routing
│   │   ├── stores/               Zustand stores (4)
│   │   ├── hooks/                Custom hooks
│   │   ├── components/
│   │   │   ├── shared/           AppHeader, Sidebar, Drawers
│   │   │   ├── craft/            Craft Tracker pages
│   │   │   ├── relic/            Relic Tracker pages
│   │   │   └── inventory/        Vault pages & tabs
│   │   ├── styles/               15 modular CSS files
│   │   ├── constants/            i18n, themes
│   │   └── utils/                helpers, storage, queryClient
│   └── dist/                     Production build (generated)
├── data/                         Cached WFCD snapshot
├── start.bat                     Windows launcher
├── start.sh                      macOS/Linux launcher
└── package.json
```

---

## Scripts

```bash
npm run dev        # Concurrent backend + Vite dev server (hot reload)
npm run build      # Production build → web/dist/
npm start          # Start production server on port 3444
npm run snapshot   # Fetch latest WFCD data snapshot
npm test           # Run backend tests
```

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3444` | HTTP server port |

---

## Troubleshooting

<details>
<summary><b>"Node.js not found" error</b></summary>

Install Node.js 18+ from https://nodejs.org. After installation, restart your terminal or computer.
</details>

<details>
<summary><b>Port 3444 already in use</b></summary>

Another app is using the port. Run with a different port:
```bash
PORT=8080 npm start
```
</details>

<details>
<summary><b>My tracked items disappeared</b></summary>

All data is stored in your browser's localStorage. It's lost if you clear browser history/cache, switch browsers, or use incognito mode. Use the **Export** button to back up your data.
</details>

<details>
<summary><b>Build fails after git pull</b></summary>

```bash
rm -rf node_modules web/dist
npm install
npm run build
```
</details>

---

## Roadmap

- [ ] PWA support (install as desktop app)
- [ ] Farm Planner page (mission planning for resources)
- [ ] Share tracker state via URL
- [ ] Drag-and-drop item reordering
- [ ] Export progress as image/PDF

---

## License

This is a **fan-made** companion app. It is not affiliated with, endorsed by, or sponsored by Digital Extremes.

- Warframe item data is provided by the [Warframe Community Developers (WFCD)](https://github.com/WFCD) under their respective licenses.
- Warframe, the Warframe logo, and all related trademarks belong to [Digital Extremes Ltd.](https://www.digitalextremes.com/)
- Source code is free to use and modify for personal purposes.

---

<div align="center">

**Made with dedication for the Tenno community**

[⬆ Back to top](#warframe-item-tracker)

</div>
