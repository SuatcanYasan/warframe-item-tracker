<div align="center">

<img src="web/public/trackerlogo.png" alt="WIT Logo" width="120" />

# Warframe Item Tracker

**A modern, theme-aware, PWA-enabled tracker for Warframe crafting, void relics, prime inventory, mastery progress, and open-world timers.**

[🇬🇧 English](./README.md) · [🇹🇷 Türkçe](./docs/README.tr.md) · [🇩🇪 Deutsch](./docs/README.de.md) · [🇫🇷 Français](./docs/README.fr.md) · [🇪🇸 Español](./docs/README.es.md) · [🇮🇹 Italiano](./docs/README.it.md) · [🇵🇹 Português](./docs/README.pt.md) · [🇷🇺 Русский](./docs/README.ru.md) · [🇯🇵 日本語](./docs/README.ja.md) · [🇸🇦 العربية](./docs/README.ar.md)

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Ant Design](https://img.shields.io/badge/Ant_Design-5-0170FE?logo=antdesign&logoColor=white)](https://ant.design)
[![Zustand](https://img.shields.io/badge/Zustand-5-443E38)](https://zustand-demo.pmnd.rs)
[![React Query](https://img.shields.io/badge/React_Query-5-FF4154?logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![i18next](https://img.shields.io/badge/i18next-26-26A69A?logo=i18next&logoColor=white)](https://www.i18next.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Node](https://img.shields.io/badge/Node-18+-43853D?logo=node.js&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-Fan_Made-CA8A04)](#license)

<p align="center">
  <img src="web/public/screenshot.png" alt="WIT Screenshot" width="820" />
</p>

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Keyboard Shortcuts](#keyboard-shortcuts)
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

**WIT (Warframe Item Tracker)** is a production-grade companion app for Warframe. It helps you track what you want to craft, which void relics drop the prime parts you need, what's in your vault, your mastery progress across 820+ items, and live open-world cycle timers — all in one place, with zero account required.

Built as a **Progressive Web App (PWA)**, WIT can be installed directly from your browser, works offline after first load, and includes a bidirectional sync system between crafting progress and relic tracking.

All data stays in your browser's localStorage. No telemetry, no server-side accounts, no sign-ups.

---

## Features

### Core Pages

| Page | What it does |
|------|--------------|
| **Dashboard** | Overview of all trackers with progress charts, live world timers slider, item previews, and tips |
| **Craft Tracking System** | Add items you want to build, see every resource requirement, drag-and-drop reorder by priority, mark materials as collected, track overall progress with visual donut chart |
| **Relic Tracking System** | View which void relics drop each prime part, mark components as found, auto-syncs bidirectionally with Craft Tracker |
| **Vault** | Add individual prime parts you own, see which sets you can complete, switch between card and sortable table views |
| **Mastery Tracker** | Browse all 820+ weapons, warframes, and companions — mark as owned or mastered with a 3-state toggle, track per-category progress |
| **World Timers** | Live countdown for Cetus day/night, Fortuna warm/cold, Deimos Fass/Vome cycles with open-world background images, plus Baro Ki'Teer arrival tracker |
| **Amp System** | Operator Amp builder with combination codes (e.g. 2-7-7), part tracker with per-set progress, Eidolon shield-break time calculator, community meta presets, and MR tracker with gild rewards |
| **Activities** | Live feed of Fissures (Lith/Meso/Neo/Axi/Requiem/Omnia), Invasions with faction rewards, Nightwave daily/weekly acts, Sortie + Archon Hunt variants, and current Arbitration — auto-refreshed every 60s |
| **Checklist** | Daily and weekly Warframe task tracker with UTC 00:00 auto-reset and preset pack (Sortie, Archon Hunt, Nightwave Dailies, bounties, Kahl, Duviri) |
| **Farm Planner** | Search a resource, add it as a tracked card with target quantity, see all drop locations in a modal, and — when tracking multiple resources — surface the shared locations that drop 2+ at once |

### User Experience

- **Setup Wizard** — Multi-step first-run onboarding (welcome → language → theme → ready) with animated transitions and live theme preview
- **Three Themes** — Orokin (gold), Drifter (green), Lotus (light blue) — every UI element adapts dynamically including icons
- **Theme Editor** — Build your own color scheme (including custom cursor color), save multiple profiles, export/import as JSON
- **10 Languages** — English, Turkish, German, French, Spanish, Italian, Portuguese, Russian, Japanese, Arabic with flagged dropdown switcher and browser-language auto-detection
- **Drag & Drop** — Reorder tracked items by priority (powered by @dnd-kit)
- **Fuzzy Search** — Typos welcome (powered by Fuse.js)
- **Keyboard Shortcuts** — Navigate, search, and switch pages without touching the mouse
- **Progress Donut Chart** — Visual completion indicator in the summary bar (recharts)
- **Relative Timestamps** — "Added 2 hours ago" on every tracked item (dayjs)
- **Screenshot Export** — One-click PNG export of your current view (html-to-image)
- **Toast Notifications** — Modern, theme-aware toasts (react-hot-toast)
- **Bidirectional Sync** — Complete a part in Craft Tracker, it's auto-marked found in Relic Tracker
- **Import/Export** — Backup your data as JSON, restore across devices
- **URL Share** — Share your tracker state as a compact DEFLATE-compressed link; open on another device or send to a friend, zero backend
- **Discord Webhook** — Post rich milestone embeds ("Esteemed Tenno ... completed X set, progress Y/Z") to your own Discord channel when Amp sets, crafts, Primes or Mastery complete — with anti-spam cooldown
- **Update Notes** — Automatic changelog modal when a new version is deployed
- **Breadcrumb Navigation** — Clear page hierarchy with clickable WIT root link
- **Live World Timers** — Real-time open world cycle countdowns powered by WarframeStatus API

### Technical

- **PWA** — Install as desktop/mobile app, works offline with service worker caching
- **Zustand Stores** — 4 domain stores (app, craft, relic, inventory) — no Redux boilerplate
- **React Query** — API caching with 5-minute stale time, background refetching
- **Virtualization Ready** — @tanstack/react-virtual available for large lists
- **Type-safe Storage** — localStorage normalization with backward compatibility
- **Theme-aware Everything** — All colors use CSS custom properties with `color-mix()`

---

## Keyboard Shortcuts

Press `?` anywhere to see the full list.

| Shortcut | Action |
|----------|--------|
| <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Space</kbd> | Open search drawer |
| <kbd>/</kbd> | Open search drawer |
| <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> | Show keyboard shortcuts |
| <kbd>0</kbd> | Go to Dashboard |
| <kbd>1</kbd> | Go to Craft Tracking System |
| <kbd>2</kbd> | Go to Relic Tracking System |
| <kbd>3</kbd> | Go to Vault |
| <kbd>4</kbd> | Go to Mastery Tracker |
| <kbd>5</kbd> | Go to World Timers |
| <kbd>?</kbd> | Show keyboard shortcuts |
| <kbd>Esc</kbd> | Close modal |

Platform-aware: Mac users see <kbd>⌘</kbd>, Windows/Linux users see <kbd>Ctrl</kbd>.

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

### Install as a Desktop App (PWA)

1. Open `http://localhost:3444` in Chrome, Edge, or Brave
2. Click the install icon in the address bar (or menu → "Install Warframe Item Tracker")
3. The app opens in its own window, appears in your start menu / dock, and works offline

---

## Usage

### Craft Tracking System

1. Click **Add** or press <kbd>Ctrl</kbd>+<kbd>K</kbd>
2. Search for an item (e.g. *"Mesa Prime"*)
3. Click the card to see its requirements
4. Enter how much of each material you own
5. The **Total Requirements** tab shows aggregate materials across all tracked items
6. **Drag the handle** on any card to reorder by priority

### Relic Tracking System

- Prime items added in Craft Tracker appear here automatically
- Click a card to see which relics drop each component
- Mark components as found — Craft Tracker updates in sync

### Vault

1. Open the **Add Part** drawer
2. Search for individual prime components (e.g. *"Ash Neuroptics"*)
3. Enter quantity
4. Switch to the **Sets** tab to see complete prime sets you can build
5. Toggle between **Card** and **Table** views

---

## Tech Stack

### Frontend

| Category | Libraries |
|----------|-----------|
| **Framework** | [React 18](https://react.dev), [Vite 5](https://vitejs.dev), [React Router 7](https://reactrouter.com) |
| **UI** | [Ant Design 5](https://ant.design), [@ant-design/icons](https://ant.design/components/icon) |
| **State** | [Zustand](https://zustand-demo.pmnd.rs), [Immer](https://immerjs.github.io/immer/) |
| **Data Fetching** | [TanStack Query](https://tanstack.com/query), [TanStack Virtual](https://tanstack.com/virtual), [TanStack Table](https://tanstack.com/table) |
| **Search** | [Fuse.js](https://fusejs.io) (fuzzy) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/), [@formkit/auto-animate](https://auto-animate.formkit.com) |
| **Drag & Drop** | [@dnd-kit/core](https://dndkit.com), [@dnd-kit/sortable](https://dndkit.com) |
| **Charts** | [Recharts](https://recharts.org) |
| **i18n** | [i18next](https://www.i18next.com), [react-i18next](https://react.i18next.com) |
| **Dates** | [Day.js](https://day.js.org) |
| **Notifications** | [react-hot-toast](https://react-hot-toast.com) |
| **Shortcuts** | [hotkeys-js](https://github.com/jaywcjlove/hotkeys-js) |
| **Export** | [html-to-image](https://github.com/bubkoo/html-to-image) |
| **PWA** | [vite-plugin-pwa](https://vite-pwa-org.netlify.app) |

### Backend

- **[Express 4](https://expressjs.com)** — HTTP server & API
- **[WFCD warframe-items](https://github.com/WFCD/warframe-items)** — Authoritative Warframe data
- **[WarframeStatus API](https://warframestat.us)** — Live world cycle & Baro Ki'Teer data
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
│   │   ├── App.jsx               Root + routing + keyboard shortcuts
│   │   ├── i18n/                 i18next initialization
│   │   ├── stores/               Zustand stores (app, craft, relic, inventory, mastery)
│   │   ├── hooks/                Custom hooks (useTranslate, useCraftDerived,
│   │   │                         useRelicSync, usePersist, useFuzzySearch,
│   │   │                         useRelativeTime, useApiQueries)
│   │   ├── components/
│   │   │   ├── shared/           AppHeader, Sidebar, Drawers, Modals
│   │   │   ├── dashboard/        Dashboard with charts, timer slider, tips
│   │   │   ├── craft/            Craft Tracker + dnd sortable grid
│   │   │   ├── relic/            Relic Tracker pages
│   │   │   ├── inventory/        Vault pages & tabs (card + table views)
│   │   │   ├── mastery/          Mastery Tracker (820+ items, 3-state toggle)
│   │   │   └── timers/           World Timers (live API + background images)
│   │   ├── styles/               20 modular CSS files
│   │   ├── constants/            i18n strings, themes
│   │   └── utils/                helpers, storage, queryClient, screenshot
│   └── dist/                     Production build with PWA assets
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
npm run build:all  # Refresh WFCD snapshot + build
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

```bash
PORT=8080 npm start
```
</details>

<details>
<summary><b>My tracked items disappeared</b></summary>

All data is stored in your browser's localStorage. It's lost if you clear browser history/cache, switch browsers, or use incognito mode. Use the **Export** button to back up your data as JSON.
</details>

<details>
<summary><b>Build fails after git pull</b></summary>

```bash
rm -rf node_modules web/dist
npm install
npm run build
```
</details>

<details>
<summary><b>PWA won't install</b></summary>

- Make sure you're using Chrome, Edge, or Brave (Firefox has limited PWA support)
- Serve over HTTPS or localhost (PWA won't install on HTTP except localhost)
- Check browser console for service worker errors
</details>

<details>
<summary><b>Icons invisible in Lotus (light) theme</b></summary>

This is a known quirk with Warframe wiki icons (they're white PNGs). The app auto-inverts them in Lotus theme via CSS filter. If you see white-on-white, hard-refresh the page (Ctrl+Shift+R).
</details>

---

## Roadmap

- [x] Dashboard with progress charts and live timers
- [x] Mastery Tracker (820+ items)
- [x] World Timers (Cetus, Fortuna, Deimos, Baro Ki'Teer)
- [x] Update notes system
- [x] Amp System (Builder, Part Tracker, Eidolon Planner, Meta Sets, MR Tracker)
- [x] 10 UI languages with browser auto-detection
- [x] Activities page (Fissures, Invasions, Nightwave, Sortie, Archon Hunt, Arbitration)
- [x] Daily / Weekly Checklist with UTC reset
- [x] URL Share (compressed link-based state transfer)
- [x] Discord Webhook integration with rich embeds
- [ ] Incarnon Adapter rotation tracker
- [ ] Mastery Rank XP Calculator
- [ ] Lich / Sister Tracker (Requiem sequence helper)
- [x] Farm Planner page (search resources, track targets, find shared drop locations)
- [ ] Arcane Tracker (Eidolon / Zariman / Entrati)
- [ ] Codex / Synthesis Tracker

---

## License

This is a **fan-made** companion app. It is not affiliated with, endorsed by, or sponsored by Digital Extremes.

- Warframe item data is provided by the [Warframe Community Developers (WFCD)](https://github.com/WFCD) under their respective licenses.
- Warframe, the Warframe logo, and all related trademarks belong to [Digital Extremes Ltd.](https://www.digitalextremes.com/)
- Source code is free to use and modify for personal purposes.

---

<div align="center">

**Made with dedication for the Tenno community**

Created by [Suatcan Yasan](https://github.com/SuatcanYasan)

[⬆ Back to top](#warframe-item-tracker)

</div>
