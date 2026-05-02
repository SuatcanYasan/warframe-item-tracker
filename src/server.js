// Sentry must be imported and initialized BEFORE any other module — its
// auto-instrumentation patches Node internals (http, express, etc.) at
// require-time. No-op when SENTRY_DSN is unset (dev / local).
const Sentry = require("@sentry/node");
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "production",
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    // Strip request body / headers / cookies that may carry user identity
    // or auth tokens before anything is shipped upstream.
    beforeSend(event) {
      if (event.user) delete event.user;
      if (event.request) {
        delete event.request.cookies;
        delete event.request.data;
        if (event.request.headers) {
          for (const k of Object.keys(event.request.headers)) {
            if (/authorization|cookie|x-access-token|api[_-]?key/i.test(k)) {
              event.request.headers[k] = "[Filtered]";
            }
          }
        }
      }
      return event;
    },
  });
}

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");

const {
  getItemByUniqueName,
  getItemMap,
  searchCraftableItems,
  searchPrimeComponents,
  getMasteryItems,
  getAmps,
  searchResources,
} = require("./services/itemsService");
const { calculateCraftRequirements } = require("./services/craftCalculator");

const PORT = process.env.PORT || 3444;
const APP_SIGNATURE = "warframe-craft-tracker";
const STARTED_AT = new Date().toISOString();
const webDistPath = path.join(__dirname, "..", "web", "dist");

const app = express();

// ---- Security headers (helmet + CSP) ----
// CSP connect-src covers: self, Supabase Realtime (wss+https), warframestat.us,
// WFCD CDN (cdn.jsdelivr.net), wiki.warframe.com.
// Ant Design + Vite require 'unsafe-inline' for styles; recharts uses SVG only.
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "style-src-elem": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "img-src": ["'self'", "data:", "https:"],
        "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
        "connect-src": [
          "'self'",
          "https://api.warframestat.us",
          "https://content.warframe.com",
          "https://api.warframe.com",
          "https://cdn.jsdelivr.net",
          "https://wiki.warframe.com",
          "https://*.supabase.co",
          "wss://*.supabase.co",
        ],
        "worker-src": ["'self'", "blob:"],
        "object-src": ["'none'"],
        "frame-ancestors": ["'none'"],
        "base-uri": ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,  // Allows wiki/CDN images without CORP headers
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ---- CORS ----
// Prod: same-origin (browser serves API from same host). Explicit whitelist for any
// standalone dev deployments. Override via ALLOWED_ORIGINS="https://a.com,https://b.com".
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: false,
  })
);

app.use(express.json({ limit: "1mb" }));

app.use(express.static(webDistPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    }
  },
}));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    appSignature: APP_SIGNATURE,
    pid: process.pid,
    startedAt: STARTED_AT,
  });
});

app.get("/api/items", async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(100, Math.floor(limitRaw)))
      : 30;

    const primeOnly = req.query.primeOnly === "true";
    const items = await searchCraftableItems(search, limit, { primeOnly });
    res.json({ items });
  } catch (error) {
    console.error("/api/items error:", error);
    res.status(500).json({ error: "Items could not be loaded." });
  }
});

app.post("/api/items/resolve-metadata", async (req, res) => {
  try {
    const rawUniqueNames = Array.isArray(req.body?.uniqueNames) ? req.body.uniqueNames : [];
    const uniqueNames = [...new Set(rawUniqueNames)]
      .filter((value) => typeof value === "string" && value.length > 0)
      .slice(0, 300);

    if (uniqueNames.length === 0) {
      res.json({ itemsByUniqueName: {} });
      return;
    }

    const itemMap = await getItemMap();
    const itemsByUniqueName = {};

    for (const uniqueName of uniqueNames) {
      const item = itemMap.get(uniqueName);
      if (!item) {
        continue;
      }

      itemsByUniqueName[uniqueName] = {
        uniqueName: item.uniqueName,
        name: item.name,
        imageUrl: item.imageUrl || null,
        type: item.type || null,
        category: item.category || item.type || null,
      };
    }

    res.json({ itemsByUniqueName });
  } catch (error) {
    console.error("/api/items/resolve-metadata error:", error);
    res.status(500).json({ error: "Metadata could not be resolved." });
  }
});

app.get("/api/items/drops/:uniqueName", async (req, res) => {
  try {
    const uniqueName = req.params.uniqueName;
    const item = await getItemByUniqueName(uniqueName);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const drops = item.drops || [];
    const componentDrops = (item.components || [])
      .filter((c) => c.drops && c.drops.length > 0)
      .map((c) => ({
        componentName: c.name,
        drops: c.drops,
      }));

    res.json({
      uniqueName: item.uniqueName,
      name: item.name,
      description: item.description || null,
      drops,
      componentDrops,
    });
  } catch (error) {
    console.error("/api/items/drops error:", error);
    res.status(500).json({ error: "Drop data could not be loaded." });
  }
});

app.get("/api/items/components", async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, Math.floor(limitRaw))) : 60;
    const components = await searchPrimeComponents(search, limit);
    res.json({ components });
  } catch (error) {
    console.error("/api/items/components error:", error);
    res.status(500).json({ error: "Components could not be loaded." });
  }
});

app.post("/api/calculate", async (req, res) => {
  try {
    const payloadItems = Array.isArray(req.body?.items) ? req.body.items : [];
    const sanitizedItems = payloadItems
      .map((item) => ({
        uniqueName: item?.uniqueName,
        quantity: Number(item?.quantity) || 1,
      }))
      .filter((item) => typeof item.uniqueName === "string" && item.uniqueName.length > 0);

    const itemMap = await getItemMap();

    const result = calculateCraftRequirements(sanitizedItems, itemMap, {
      expandSubcomponents: false,
      includeBlueprints: Boolean(req.body?.includeBlueprints ?? false),
    });

    res.json(result);
  } catch (error) {
    console.error("/api/calculate error:", error);
    res.status(500).json({ error: "Requirements could not be calculated." });
  }
});

app.get("/api/mastery/items", async (_req, res) => {
  try {
    const categorized = await getMasteryItems();
    res.json(categorized);
  } catch (error) {
    console.error("/api/mastery/items error:", error);
    res.status(500).json({ error: "Could not fetch mastery items." });
  }
});

app.get("/api/mastery/junctions", (_req, res) => {
  res.json({
    junctions: JUNCTIONS.map(({ key, from, to }) => ({ key, from, to })),
    xpPerJunction: MR_XP_PER_JUNCTION,
  });
});

// Static schema for the intrinsics view. Keys must match the field
// names produced by summarizeProfile (intrinsicRanks).
const INTRINSICS_SCHEMA = [
  { key: "tactical",    category: "railjack", maxRank: 10 },
  { key: "piloting",    category: "railjack", maxRank: 10 },
  { key: "gunnery",     category: "railjack", maxRank: 10 },
  { key: "engineering", category: "railjack", maxRank: 10 },
  { key: "command",     category: "railjack", maxRank: 10 },
  { key: "riding",      category: "drifter",  maxRank: 10 },
  { key: "combat",      category: "drifter",  maxRank: 10 },
  { key: "opportunity", category: "drifter",  maxRank: 10 },
  { key: "endurance",   category: "drifter",  maxRank: 10 },
];

app.get("/api/mastery/intrinsics", (_req, res) => {
  res.json({
    intrinsics: INTRINSICS_SCHEMA,
    xpPerRank: MR_XP_PER_INTRINSIC_RANK,
  });
});

// Star chart node listing — built once at module load from the
// bundled solNodes data (warframe-worldstate-data). We strip Conclave
// and Relay nodes (no MR XP) and require a "(Planet)" suffix in the
// node name so we know which system to group into.
let STAR_CHART_NODES = null;
function getStarChartNodes() {
  if (STAR_CHART_NODES) return STAR_CHART_NODES;
  // eslint-disable-next-line global-require
  const sol = require("../node_modules/warframe-worldstate-data/dist/data/solNodes.json");
  const EXCLUDE = new Set(["Conclave", "Relay", "Ancient Retribution"]);
  const out = {};
  for (const [k, n] of Object.entries(sol)) {
    if (EXCLUDE.has(n.type)) continue;
    const m = /\(([^)]+)\)$/.exec(n.value || "");
    if (!m) continue;
    const planet = m[1].trim();
    const name = n.value.replace(/\s*\([^)]+\)\s*$/, "").trim();
    (out[planet] ||= []).push({
      key: k,
      name,
      missionType: n.type,
      faction: n.enemy,
    });
  }
  // Sort each planet alphabetically by name
  for (const arr of Object.values(out)) arr.sort((a, b) => a.name.localeCompare(b.name));
  STAR_CHART_NODES = out;
  return STAR_CHART_NODES;
}

app.get("/api/mastery/star-chart", (_req, res) => {
  res.json({
    nodesByPlanet: getStarChartNodes(),
    xpPerNode: MR_XP_PER_STAR_CHART_NODE,
  });
});

app.get("/api/amps", async (_req, res) => {
  try {
    const amps = await getAmps();
    res.json(amps);
  } catch (error) {
    console.error("/api/amps error:", error);
    res.status(500).json({ error: "Could not fetch amps." });
  }
});

app.get("/api/resources/search", async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 20));
    const results = await searchResources(search, limit);
    res.json({ results });
  } catch (error) {
    console.error("/api/resources/search error:", error);
    res.status(500).json({ error: "Resources could not be loaded." });
  }
});

// Drop search proxy — warframestat.us /drops/search/{query}/
// Each distinct resource name is cached for 30 minutes (resources don't
// change frequently, saves upstream calls).
const dropsCache = new Map();  // name -> { data, ts }
const DROPS_TTL_MS = 30 * 60 * 1000;

app.get("/api/drops/search/:name", async (req, res) => {
  try {
    const raw = String(req.params.name || "").trim();
    if (!raw) return res.status(400).json({ error: "Missing query" });
    const key = raw.toLowerCase();
    const now = Date.now();
    const cached = dropsCache.get(key);
    if (cached && now - cached.ts < DROPS_TTL_MS) {
      return res.json(cached.data);
    }
    const url = `https://api.warframestat.us/drops/search/${encodeURIComponent(raw)}/`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": "Mozilla/5.0 (warframe-item-tracker)",
        "Accept": "application/json",
      },
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream ${response.status}` });
    }
    const text = await response.text();
    const data = text ? JSON.parse(text) : [];
    dropsCache.set(key, { data, ts: now });
    // Cleanup old entries (>2h)
    for (const [k, v] of dropsCache.entries()) {
      if (now - v.ts > 2 * 60 * 60 * 1000) dropsCache.delete(k);
    }
    res.json(data);
  } catch (error) {
    console.error("/api/drops error:", error);
    res.status(500).json({ error: "Could not search drops." });
  }
});

app.get("/api/activities", async (_req, res) => {
  try {
    const ws = await getWorldstate();
    res.json({
      fissures: Array.isArray(ws.fissures) ? ws.fissures : [],
      invasions: Array.isArray(ws.invasions) ? ws.invasions : [],
      nightwave: ws.nightwave || null,
      sortie: ws.sortie || null,
      archonHunt: ws.archonHunt || null,
      arbitration: ws.arbitration || null,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("/api/activities error:", error);
    res.status(500).json({ error: "Could not fetch activities." });
  }
});

// Primary source: Digital Extremes' raw worldstate. Always available
// since this is what powers the in-game world. Parsed locally with
// the same WFCD parser warframestat.us uses, so the output shape is
// identical (frontend doesn't need any changes).
//
// IMPORTANT: We use the new api.warframe.com endpoint directly. The
// old content.warframe.com URL still works via a 301 redirect, but
// adding ANY query parameter (including a cache-bust) causes the
// new CDN to return 409 Conflict — so we keep the URL pristine and
// rely on our 30s in-process cache for freshness control instead.
const DE_WORLDSTATE_URL = "https://api.warframe.com/cdn/worldState.php";
// Secondary source: warframestat.us. Kept for redundancy in case DE
// blocks our IP — but as of 2026-05 the convenience endpoints are
// flaky (200 + empty body or 404 on per-field paths), so we no longer
// rely on it as primary.
const WF_STAT_BASE = "https://api.warframestat.us/pc";

// Lazy-loaded ESM parser (server is CJS — must dynamic import).
// If the import rejects (e.g. transient ESM-loader hiccup), null the
// promise so the next call retries instead of caching the rejection.
let _wfParserPromise = null;
function loadParser() {
  if (!_wfParserPromise) {
    _wfParserPromise = import("warframe-worldstate-parser")
      .then((m) => m.default || m)
      .catch((err) => {
        _wfParserPromise = null;
        throw err;
      });
  }
  return _wfParserPromise;
}

let worldstateCache = { data: null, ts: 0 };

// Per-field fallback endpoints — used when the bulk /pc/ payload comes
// back empty (the upstream returns 200 + empty body intermittently).
// Mapping is `field name in /pc/ payload` → `path under /pc/`.
// Trailing slash matters — without it the upstream returns a 301
// redirect (200 once followed) and adds a needless round-trip.
const PER_FIELD_PATHS = {
  cetusCycle: "/cetusCycle/",
  vallisCycle: "/vallisCycle/",
  cambionCycle: "/cambionCycle/",
  voidTrader: "/voidTrader/",
  fissures: "/fissures/",
  invasions: "/invasions/",
  nightwave: "/nightwave/",
  sortie: "/sortie/",
  archonHunt: "/archonHunt/",
  arbitration: "/arbitration/",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJsonOrNull(url) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": "Mozilla/5.0 (warframe-item-tracker)",
        "Accept": "application/json",
        "Cache-Control": "no-cache",
      },
    });
    if (!response.ok) return null;
    const text = await response.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch { return null; }
  } catch {
    return null;
  }
}

// Pull DE's raw worldstate and parse it with the WFCD parser. The
// parser yields the same shape warframestat.us would (cetusCycle,
// vallisCycle, cambionCycle, voidTrader, fissures[], invasions[],
// sortie, archonHunt, arbitration, nightwave) — so the rest of the
// pipeline doesn't care which source we used.
async function fetchFromDE() {
  let stage = "init";
  try {
    stage = "fetch";
    // No query string — DE's new CDN rejects any with 409 Conflict.
    const response = await fetch(DE_WORLDSTATE_URL, {
      signal: AbortSignal.timeout(15000),
      headers: {
        "User-Agent": "Mozilla/5.0 (warframe-item-tracker)",
        "Accept": "application/json, text/plain, */*",
      },
    });
    if (!response.ok) {
      console.warn(`[worldstate] DE responded ${response.status} ${response.statusText}`);
      return null;
    }
    stage = "read-body";
    const text = await response.text();
    if (!text) {
      console.warn("[worldstate] DE returned empty body");
      return null;
    }

    stage = "load-parser";
    const WorldState = await loadParser();
    stage = "parse";
    // The WFCD parser console.logs informational notes when optional
    // fields are missing from DE's payload (e.g. "No defined kuva data,
    // skipping data" for KuvaMissions, "No outpost data, skipping" for
    // SentientOutposts). We don't surface these fields anywhere, so the
    // logs are pure noise — silence them just for the parse call.
    const PARSER_NOISE = /^No (defined kuva|outpost) data, skipping/;
    const origLog = console.log;
    console.log = (msg, ...args) => {
      if (typeof msg === "string" && PARSER_NOISE.test(msg)) return;
      origLog(msg, ...args);
    };
    let ws;
    try {
      ws = await WorldState.build(text, { locale: "en", platform: "pc" });
    } finally {
      console.log = origLog;
    }
    if (!ws) {
      console.warn("[worldstate] parser returned null");
      return null;
    }

    // Parser objects carry methods + non-serializable fields. JSON
    // round-trip strips those, leaving plain data ready for transport.
    stage = "serialize";
    return JSON.parse(JSON.stringify(ws));
  } catch (error) {
    console.warn(`[worldstate] DE source failed at ${stage}: ${error.name}: ${error.message}`);
    if (error.cause) console.warn(`  cause: ${error.cause.message || error.cause}`);
    return null;
  }
}

async function fetchWorldstateOnce() {
  // Cache-bust to bypass any CDN-side stale empty body.
  const data = await fetchJsonOrNull(`${WF_STAT_BASE}/?cb=${Date.now()}`);
  if (!data || typeof data !== "object") return null;
  return data;
}

// Last-resort: rebuild the worldstate slice we care about by hitting the
// per-field endpoints individually. Slower but works when /pc/ is broken.
async function fetchPerField() {
  const entries = await Promise.all(
    Object.entries(PER_FIELD_PATHS).map(async ([field, path]) => {
      const value = await fetchJsonOrNull(`${WF_STAT_BASE}${path}?cb=${Date.now()}`);
      return [field, value];
    }),
  );
  const merged = Object.fromEntries(entries);
  // Need at least one field to consider this a success.
  const anyValue = Object.values(merged).some((v) => v && (Array.isArray(v) ? v.length > 0 : true));
  return anyValue ? merged : null;
}

async function getWorldstate() {
  const now = Date.now();
  const cacheFresh = worldstateCache.data && now - worldstateCache.ts < 30000;
  if (cacheFresh) return worldstateCache.data;

  // PRIMARY: Digital Extremes' raw worldstate, parsed locally. This is
  // the canonical source — warframestat.us is just a public mirror that
  // happens to be unstable lately.
  const fromDE = await fetchFromDE();
  if (fromDE) {
    worldstateCache = { data: fromDE, ts: Date.now() };
    return fromDE;
  }

  // SECONDARY: warframestat.us bulk endpoint, in case DE blocks our IP
  // or the parser hits an unsupported payload. 5 attempts w/ backoff.
  for (let i = 0; i < 5; i++) {
    const data = await fetchWorldstateOnce();
    if (data) {
      worldstateCache = { data, ts: Date.now() };
      return data;
    }
    if (i < 4) await sleep(50 * Math.pow(2, i));
  }

  // Bulk endpoint kept failing — try the per-field rebuild path.
  const merged = await fetchPerField();
  if (merged) {
    console.warn("[worldstate] bulk endpoint failed, served per-field rebuild");
    worldstateCache = { data: merged, ts: Date.now() };
    return merged;
  }

  // Everything upstream failed — fall back to stale cache if we have any.
  // Serving slightly stale data is always better than a 500 for the user.
  if (worldstateCache.data) {
    const ageMin = Math.round((now - worldstateCache.ts) / 60000);
    console.warn(`[worldstate] all upstream paths failed, serving stale cache (age ${ageMin}m)`);
    return worldstateCache.data;
  }
  throw new Error("worldstate unavailable (no cache, all upstream paths returned empty)");
}

app.get("/api/timers", async (_req, res) => {
  try {
    const ws = await getWorldstate();
    res.json({
      cetus: ws.cetusCycle || null,
      vallis: ws.vallisCycle || null,
      cambion: ws.cambionCycle || null,
      voidTrader: ws.voidTrader || null,
    });
  } catch (error) {
    console.error("/api/timers error:", error);
    res.status(500).json({ error: "Could not fetch timers." });
  }
});

// ============================================================================
// /api/profile/import — DE proxy + WFCD profile parser
// ----------------------------------------------------------------------------
// DE's getProfileViewingData.php is public but CORS-blocked, so we proxy it.
// playerId is a 24-char hex string from the player's local EE.log file.
// The browser-friendly alternative (POST raw JSON body) lets users bypass
// playerId discovery entirely.
//
// Privacy: we don't persist anything — request → DE → parse → minimal
// summary returned to caller. No log of playerIds.
// ============================================================================

const DE_PROFILE_URL = "https://content.warframe.com/dynamic/getProfileViewingData.php";

let _profileParserPromise = null;
function loadProfileParser() {
  if (!_profileParserPromise) {
    _profileParserPromise = import("@wfcd/profile-parser/Parser")
      .then((m) => m.default || m)
      .catch((err) => {
        _profileParserPromise = null;
        throw err;
      });
  }
  return _profileParserPromise;
}

// 32-byte hex MongoDB ObjectId (24 chars). Reject anything else to avoid
// attacker-controlled URL injection into upstream.
const PLAYER_ID_RE = /^[a-f0-9]{24}$/i;

// Per-item-category MR XP scaling. Mirrored from web/src/constants/masteryXp.ts
// (server can't import the .ts file directly without a build step).
const FRAME_AFFINITY_PER_RANK_SQ = 1000;
const WEAPON_AFFINITY_PER_RANK_SQ = 500;

function detectCategory(uniqueName) {
  const u = String(uniqueName || "");
  if (/Necramech|MechSuit/i.test(u)) return { perRankXp: 200, maxRank: 40, scaling: FRAME_AFFINITY_PER_RANK_SQ };
  if (/Hoverboard|KDrive|Kdrive|K-Drive/i.test(u)) return { perRankXp: 100, maxRank: 30, scaling: WEAPON_AFFINITY_PER_RANK_SQ };
  if (/\b(Kuva|Tenet|Paracesis|Coda)\b/i.test(u)) return { perRankXp: 100, maxRank: 40, scaling: WEAPON_AFFINITY_PER_RANK_SQ };
  if (/Sentinel/i.test(u)) return { perRankXp: 200, maxRank: 30, scaling: FRAME_AFFINITY_PER_RANK_SQ };
  if (/KubrowPet|CatbrowPet|InfestedCatbrow|InfestedKubrow|MoaPets|PetPredasite|PetVulpaphyla/i.test(u)) {
    return { perRankXp: 200, maxRank: 30, scaling: FRAME_AFFINITY_PER_RANK_SQ };
  }
  if (/Archwing/i.test(u)) return { perRankXp: 200, maxRank: 30, scaling: FRAME_AFFINITY_PER_RANK_SQ };
  if (/Powersuit/i.test(u)) return { perRankXp: 200, maxRank: 30, scaling: FRAME_AFFINITY_PER_RANK_SQ };
  return { perRankXp: 100, maxRank: 30, scaling: WEAPON_AFFINITY_PER_RANK_SQ };
}

function affinityToRank(affinity, info) {
  const safe = Math.max(0, Number(affinity) || 0);
  const maxAffinity = info.scaling * info.maxRank * info.maxRank;
  if (safe >= maxAffinity) return info.maxRank;
  return Math.min(info.maxRank, Math.floor(Math.sqrt(safe / info.scaling)));
}

const MR_XP_PER_INTRINSIC_RANK = 1_500;
const MR_XP_PER_JUNCTION = 1_000;
const MR_XP_PER_STAR_CHART_NODE = 63;

// Star chart junctions. DE doesn't expose junction completion in
// profile data, but it can be inferred: if the player has any mission
// node on planet X, they must have completed the junction leading to X.
// `from` = planet that hosts the junction node; `to` = planet it unlocks.
// `requiredPlanet` is what we look for in the player's missions to
// confirm completion.
const JUNCTIONS = [
  { key: "VenusJunction",   from: "Earth",   to: "Venus",   requiredPlanet: "Venus" },
  { key: "MercuryJunction", from: "Venus",   to: "Mercury", requiredPlanet: "Mercury" },
  { key: "MarsJunction",    from: "Earth",   to: "Mars",    requiredPlanet: "Mars" },
  { key: "PhobosJunction",  from: "Mars",    to: "Phobos",  requiredPlanet: "Phobos" },
  { key: "CeresJunction",   from: "Phobos",  to: "Ceres",   requiredPlanet: "Ceres" },
  { key: "JupiterJunction", from: "Ceres",   to: "Jupiter", requiredPlanet: "Jupiter" },
  { key: "EuropaJunction",  from: "Jupiter", to: "Europa",  requiredPlanet: "Europa" },
  { key: "SaturnJunction",  from: "Jupiter", to: "Saturn",  requiredPlanet: "Saturn" },
  { key: "UranusJunction",  from: "Saturn",  to: "Uranus",  requiredPlanet: "Uranus" },
  { key: "NeptuneJunction", from: "Uranus",  to: "Neptune", requiredPlanet: "Neptune" },
  { key: "PlutoJunction",   from: "Neptune", to: "Pluto",   requiredPlanet: "Pluto" },
  { key: "SednaJunction",   from: "Pluto",   to: "Sedna",   requiredPlanet: "Sedna" },
  { key: "ErisJunction",    from: "Pluto",   to: "Eris",    requiredPlanet: "Eris" },
  { key: "LuaJunction",     from: "Earth",   to: "Lua",     requiredPlanet: "Lua" },
];

// Walk the player's mission list. Each Mission carries `node` like
// "Hydron (Sedna)" or just the node name; the planet is in parens.
// We just collect the unique planet set and check which junction
// requirements are satisfied.
function inferJunctionsFromMissions(missions) {
  const planetSet = new Set();
  for (const m of missions || []) {
    const raw = m?.node || "";
    const match = /\(([^)]+)\)/.exec(raw);
    if (match) planetSet.add(match[1].trim());
  }
  return JUNCTIONS.filter((j) => planetSet.has(j.requiredPlanet)).map((j) => j.key);
}

function summarizeProfile(profile) {
  // ---- Items (xpInfo carries lifetime affinity) ----
  // Convert each item's affinity to its rank, then to MR XP.
  let itemsXp = 0;
  const xpItems = (profile.loadout?.xpInfo || []).map((it) => {
    const info = detectCategory(it.uniqueName);
    const lifetimeAffinity = Number(it.xp) || 0;
    const rank = affinityToRank(lifetimeAffinity, info);
    const masteryXp = rank * info.perRankXp;
    itemsXp += masteryXp;
    return {
      uniqueName: it.uniqueName,
      affinity: lifetimeAffinity,
      rank,
      maxRank: info.maxRank,
      masteryXp,
    };
  });

  // ---- Intrinsics (Drifter + Railjack) ----
  // Parser splits each intrinsic into its own field. We grab the 9
  // individual ranks (5 Railjack + 4 Drifter) — `railjack`/`drifter`
  // are aggregate totals that would double-count.
  const intrinsicRanks = {
    tactical:    Number(profile.intrinsics?.tactical) || 0,
    piloting:    Number(profile.intrinsics?.piloting) || 0,
    gunnery:     Number(profile.intrinsics?.gunnery) || 0,
    engineering: Number(profile.intrinsics?.engineering) || 0,
    command:     Number(profile.intrinsics?.command) || 0,
    riding:      Number(profile.intrinsics?.riding) || 0,
    combat:      Number(profile.intrinsics?.combat) || 0,
    opportunity: Number(profile.intrinsics?.opportunity) || 0,
    endurance:   Number(profile.intrinsics?.endurance) || 0,
  };
  let intrinsicRankTotal = 0;
  for (const v of Object.values(intrinsicRanks)) intrinsicRankTotal += v;
  const intrinsicsXp = intrinsicRankTotal * MR_XP_PER_INTRINSIC_RANK;

  // ---- Star chart nodes ----
  const missionCount = Array.isArray(profile.missions) ? profile.missions.length : 0;
  const starChartXp = missionCount * MR_XP_PER_STAR_CHART_NODE;
  const completedNodeKeys = Array.isArray(profile.missions)
    ? profile.missions.map((m) => m?.nodeKey).filter(Boolean)
    : [];

  // ---- Junctions (inferred from missions: any node on planet X means
  // the junction TO X has been completed) ----
  const completedJunctionKeys = inferJunctionsFromMissions(profile.missions);
  const junctionXp = completedJunctionKeys.length * MR_XP_PER_JUNCTION;

  const realTotalMasteryXp = itemsXp + intrinsicsXp + starChartXp + junctionXp;

  return {
    accountId: profile.accountId,
    displayName: profile.displayName,
    platformNames: profile.platformNames || [],
    masteryRank: profile.masteryRank,
    itemCount: xpItems.length,
    xpItems,
    realTotalMasteryXp,
    completedJunctionKeys,
    intrinsicRanks,
    completedNodeKeys,
    breakdown: {
      items: itemsXp,
      intrinsics: intrinsicsXp,
      starChart: starChartXp,
      junctions: junctionXp,
      intrinsicRankTotal,
      missionCount,
    },
  };
}

app.post("/api/profile/import", async (req, res) => {
  const playerId = String(req.body?.playerId || "").trim();
  const rawProfileJson = req.body?.rawProfileJson;

  let profileData;

  if (rawProfileJson) {
    // User uploaded their own JSON dump (from browse.wf-style flow). Trust
    // it — they've already passed it through their browser to fetch.
    if (typeof rawProfileJson !== "object") {
      return res.status(400).json({ error: "rawProfileJson must be an object" });
    }
    profileData = rawProfileJson;
  } else {
    // Server-side proxy. Validate playerId before injecting into URL.
    if (!PLAYER_ID_RE.test(playerId)) {
      return res.status(400).json({
        error: "Invalid playerId. Must be a 24-character hex string from EE.log.",
      });
    }

    try {
      const upstream = await fetch(`${DE_PROFILE_URL}?playerId=${playerId}`, {
        signal: AbortSignal.timeout(15000),
        headers: {
          "User-Agent": "Mozilla/5.0 (warframe-item-tracker)",
          "Accept": "application/json, text/plain, */*",
        },
      });
      if (!upstream.ok) {
        return res.status(upstream.status === 404 ? 404 : 502).json({
          error: upstream.status === 404
            ? "Player not found. Double-check the playerId from EE.log."
            : `DE responded with ${upstream.status}`,
        });
      }
      const text = await upstream.text();
      if (!text) {
        return res.status(502).json({ error: "DE returned empty body" });
      }
      try {
        profileData = JSON.parse(text);
      } catch {
        return res.status(502).json({ error: "DE returned invalid JSON" });
      }
    } catch (error) {
      console.warn("[profile-import] proxy failed:", error.message);
      return res.status(502).json({ error: "Could not reach Warframe profile API" });
    }
  }

  // Parse with @wfcd/profile-parser. The parser console.logs notes for
  // missing optional fields; we suppress them just like in worldstate fetch.
  let parsed;
  const PARSER_NOISE = /^(No defined|Skipping|Profile)/;
  const origLog = console.log;
  console.log = (msg, ...args) => {
    if (typeof msg === "string" && PARSER_NOISE.test(msg)) return;
    origLog(msg, ...args);
  };
  try {
    const ProfileParser = await loadProfileParser();
    parsed = new ProfileParser(profileData, "en", false);
  } catch (error) {
    console.warn("[profile-import] parse failed:", error.message);
    return res.status(422).json({ error: `Profile data could not be parsed: ${error.message}` });
  } finally {
    console.log = origLog;
  }

  const summary = summarizeProfile(parsed.profile);
  res.json(summary);
});

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not found" });
  }

  return res.sendFile(path.join(webDistPath, "index.html"));
});

// Sentry's Express error handler — must be registered after all routes /
// middleware, before any custom error handlers. No-op when DSN is unset.
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Fallback error handler — runs after Sentry, returns a sanitized JSON 500
// for API routes so we never leak stack traces to clients.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  if (req.path && req.path.startsWith("/api/")) {
    return res.status(500).json({ error: "Internal server error" });
  }
  return res.status(500).send("Internal server error");
});

// Self-ping to prevent free-tier hosts (Render, etc.) from sleeping.
// Pings own /api/health every 10 minutes when SELF_PING_URL is set.
function startSelfPing() {
  const url = process.env.SELF_PING_URL;
  if (!url) return;
  const intervalMs = 10 * 60 * 1000; // 10 minutes
  setInterval(async () => {
    try {
      const res = await fetch(url);
      console.log(`[self-ping] ${new Date().toISOString()} → ${res.status}`);
    } catch (error) {
      console.warn(`[self-ping] failed: ${error?.message || error}`);
    }
  }, intervalMs);
  console.log(`[self-ping] enabled → ${url} every ${intervalMs / 60000}min`);
}

async function startServer() {
  try {
    const server = app.listen(PORT, () => {
      console.log(`Warframe craft tracker is running on http://localhost:${PORT}`);
      startSelfPing();
    });

    server.on("error", (error) => {
      if (error && error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Could not start backend.`);
      } else {
        console.error("Server listen error:", error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer,
};




