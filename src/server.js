const express = require("express");
const path = require("path");

const {
  getItemByUniqueName,
  getItemMap,
  getI18nForLanguage,
  searchCraftableItems,
  searchPrimeComponents,
  getMasteryItems,
  getAmps,
} = require("./services/itemsService");
const { calculateCraftRequirements } = require("./services/craftCalculator");

const PORT = process.env.PORT || 3444;
const APP_SIGNATURE = "warframe-craft-tracker";
const STARTED_AT = new Date().toISOString();
const webDistPath = path.join(__dirname, "..", "web", "dist");

const app = express();
app.use(express.json());
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

app.get("/api/i18n", async (req, res) => {
  try {
    const lang = typeof req.query.lang === "string" && req.query.lang.trim().length > 0
      ? req.query.lang.trim()
      : "tr";

    const names = await getI18nForLanguage(lang);
    res.json({ lang, names });
  } catch (error) {
    console.error("/api/i18n error:", error);
    res.status(500).json({ error: "i18n data could not be loaded." });
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

const WF_STAT_BASE = "https://api.warframestat.us/pc";
let timerCache = { data: null, ts: 0 };

app.get("/api/timers", async (_req, res) => {
  try {
    const now = Date.now();
    const cacheValid = timerCache.data && (now - timerCache.ts < 30000);
    const anyExpired = timerCache.data && [timerCache.data.cetus, timerCache.data.vallis, timerCache.data.cambion]
      .some((c) => c?.expiry && new Date(c.expiry).getTime() <= now);
    if (cacheValid && !anyExpired) {
      return res.json(timerCache.data);
    }
    const endpoints = ["cetusCycle", "vallisCycle", "cambionCycle", "voidTrader"];
    const results = await Promise.all(
      endpoints.map((e) =>
        fetch(`${WF_STAT_BASE}/${e}/`, { signal: AbortSignal.timeout(8000) })
          .then((r) => r.json())
          .catch(() => null)
      )
    );
    const data = { cetus: results[0], vallis: results[1], cambion: results[2], voidTrader: results[3] };
    timerCache = { data, ts: Date.now() };
    res.json(data);
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




