const express = require("express");
const fs = require("fs");
const path = require("path");

const {
  getItemMap,
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




