const express = require("express");
const fs = require("fs");
const path = require("path");

const {
  getItemByUniqueName,
  getItemMap,
  getI18nForLanguage,
  searchCraftableItems,
} = require("./services/itemsService");
const { calculateCraftRequirements } = require("./services/craftCalculator");

const PORT = process.env.PORT || 3444;
const APP_SIGNATURE = "warframe-craft-tracker";
const STARTED_AT = new Date().toISOString();
const webDistPath = path.join(__dirname, "..", "web", "dist");
const legacyPublicPath = path.join(__dirname, "..", "public");
const hasWebBuild = fs.existsSync(path.join(webDistPath, "index.html"));

const app = express();
app.use(express.json());
if (hasWebBuild) {
  app.use(express.static(webDistPath));
} else {
  app.use(express.static(legacyPublicPath));
}

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

    const items = await searchCraftableItems(search, limit);
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

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not found" });
  }

  const fallbackIndexPath = hasWebBuild
    ? path.join(webDistPath, "index.html")
    : path.join(legacyPublicPath, "index.html");

  return res.sendFile(fallbackIndexPath);
});

async function startServer() {
  try {
    const server = app.listen(PORT, () => {
      console.log(`Warframe craft tracker is running on http://localhost:${PORT}`);
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




