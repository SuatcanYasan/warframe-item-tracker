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
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "https:"],
        "font-src": ["'self'", "data:"],
        "connect-src": [
          "'self'",
          "https://api.warframestat.us",
          "https://content.warframe.com",
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

const WF_STAT_BASE = "https://api.warframestat.us/pc";
// Single shared worldstate cache — the upstream API dropped per-field
// endpoints, so we fetch the whole /pc/ payload once and slice it.
let worldstateCache = { data: null, ts: 0 };

const STALE_MAX_AGE = 60 * 60 * 1000;   // serve stale cache up to 1 hour on error

async function fetchWorldstateOnce() {
  const response = await fetch(`${WF_STAT_BASE}/?cb=${Date.now()}`, {
    signal: AbortSignal.timeout(10000),
    headers: {
      "User-Agent": "Mozilla/5.0 (warframe-item-tracker)",
      "Accept": "application/json",
      "Cache-Control": "no-cache",
    },
  });
  if (!response.ok) throw new Error(`worldstate ${response.status}`);
  const text = await response.text();
  if (!text) throw new Error("empty body");
  return JSON.parse(text);
}

async function getWorldstate() {
  const now = Date.now();
  const cacheFresh = worldstateCache.data && now - worldstateCache.ts < 30000;
  if (cacheFresh) return worldstateCache.data;

  // Try to refresh, up to 3 attempts
  let lastError = null;
  for (let i = 0; i < 3; i++) {
    try {
      const data = await fetchWorldstateOnce();
      worldstateCache = { data, ts: Date.now() };
      return data;
    } catch (err) {
      lastError = err;
    }
  }

  // Refresh failed — fall back to stale cache if it's within 1 hour
  if (worldstateCache.data && now - worldstateCache.ts < STALE_MAX_AGE) {
    console.warn(
      `[worldstate] upstream failed (${lastError?.message}), serving stale cache (age ${Math.round((now - worldstateCache.ts) / 1000)}s)`,
    );
    return worldstateCache.data;
  }
  throw lastError || new Error("worldstate unavailable");
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

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not found" });
  }

  return res.sendFile(path.join(webDistPath, "index.html"));
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




