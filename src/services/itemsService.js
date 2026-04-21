const fs = require("fs/promises");
const path = require("path");

const ITEMS_URLS = [
  "https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/All.json",
  "https://cdn.jsdelivr.net/gh/WFCD/warframe-items@master/data/json/All.json",
];
const I18N_URLS = [
  "https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/i18n.json",
  "https://cdn.jsdelivr.net/gh/WFCD/warframe-items@master/data/json/i18n.json",
];
// Item icons come from WFCD's curated CDN — filenames there actually match
// the 6k+ items in the dataset. Wiki.warframe.com uses different naming
// conventions (e.g. "CitrineIcon.png" vs "Citrine.png"), so deriving wiki URLs
// from item names would 404 for most items.
const ITEM_IMAGE_BASE_URL = "https://cdn.jsdelivr.net/gh/WFCD/warframe-items@master/data/img";
const CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const FETCH_TIMEOUT_MS = 15000;
const SNAPSHOT_PATH = path.join(__dirname, "..", "..", "data", "items.snapshot.json");
const I18N_SNAPSHOT_PATH = path.join(__dirname, "..", "..", "data", "i18n.snapshot.json");

let cache = {
  loadedAt: 0,
  items: null,
  itemMap: null,
};

let loadingPromise = null;

let i18nCache = {
  loadedAt: 0,
  data: null,
};

let i18nLoadingPromise = null;

function normalizeDrops(drops) {
  if (!Array.isArray(drops) || drops.length === 0) return [];
  return drops
    .filter((d) => d && d.location)
    .map((d) => ({
      location: d.location,
      chance: d.chance ?? null,
      rarity: d.rarity ?? null,
      type: d.type ?? null,
    }));
}

function normalizeItem(item) {
  const imageName = item.imageName || null;

  return {
    uniqueName: item.uniqueName,
    name: item.name,
    imageName,
    imageUrl: imageName ? `${ITEM_IMAGE_BASE_URL}/${encodeURIComponent(imageName)}` : null,
    type: item.type,
    category: item.category,
    description: item.description || null,
    buildTime: item.buildTime,
    buildPrice: item.buildPrice,
    buildQuantity: item.buildQuantity ?? 1,
    // Kept for weapon/amp stat calculations — WFCD nests stats under attacks[0]
    attacks: Array.isArray(item.attacks) ? item.attacks : null,
    masteryReq: item.masteryReq ?? null,
    drops: normalizeDrops(item.drops),
    components: Array.isArray(item.components)
      ? item.components.map((component) => ({
          uniqueName: component.uniqueName,
          name: component.name,
          itemCount: component.itemCount ?? 1,
          drops: normalizeDrops(component.drops),
        }))
      : [],
  };
}

function hasValidCache() {
  return (
    cache.items &&
    cache.itemMap &&
    Date.now() - cache.loadedAt < CACHE_TTL_MS
  );
}

function writeCacheFromRawItems(rawItems) {
  const items = rawItems.map(normalizeItem);
  const itemMap = new Map(items.map((item) => [item.uniqueName, item]));

  cache = {
    loadedAt: Date.now(),
    items,
    itemMap,
  };

  return cache;
}

async function fetchJsonWithTimeout(url, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`WFCD data fetch failed: ${response.status}`);
    }
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchAllItemsFromRemote() {
  let lastError = null;

  for (const url of ITEMS_URLS) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const rawItems = await fetchJsonWithTimeout(url);
      return writeCacheFromRawItems(rawItems);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("WFCD sources are unavailable");
}

async function loadItemsFromSnapshot() {
  const raw = await fs.readFile(SNAPSHOT_PATH, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Local snapshot is invalid");
  }

  return writeCacheFromRawItems(parsed);
}

async function fetchAllItems() {
  try {
    return await fetchAllItemsFromRemote();
  } catch (remoteError) {
    try {
      const snapshotCache = await loadItemsFromSnapshot();
      console.warn("Using local item snapshot because remote fetch failed:", remoteError?.message || remoteError);
      return snapshotCache;
    } catch (snapshotError) {
      throw new Error(
        `Item data could not be loaded. Remote error: ${remoteError?.message || remoteError}. Snapshot error: ${snapshotError?.message || snapshotError}`,
      );
    }
  }
}

async function ensureDataLoaded() {
  if (hasValidCache()) {
    return cache;
  }

  if (!loadingPromise) {
    loadingPromise = fetchAllItems().finally(() => {
      loadingPromise = null;
    });
  }

  return loadingPromise;
}

function isCraftable(item) {
  return Array.isArray(item.components) && item.components.length > 0;
}

// Well-known items to feature when no search query is provided.
const FEATURED_NAMES = new Set([
  "ash prime", "banshee prime", "chroma prime", "ember prime", "equinox prime",
  "excalibur umbra", "frost prime", "gara prime", "garuda prime", "gauss",
  "harrow prime", "hildryn", "hydroid prime", "inaros prime", "ivara prime",
  "khora prime", "limbo prime", "loki prime", "mag prime", "mesa prime",
  "mirage prime", "nekros prime", "nezha prime", "nidus prime", "nova prime",
  "oberon prime", "octavia prime", "protea", "revenant prime", "rhino prime",
  "saryn prime", "sevagoth", "titania prime", "trinity prime", "valkyr prime",
  "vauban prime", "volt prime", "wisp", "wukong prime", "zephyr prime",
]);

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function searchCraftableItems(searchText = "", limit = 30, { primeOnly = false } = {}) {
  const { items } = await ensureDataLoaded();
  const query = searchText.trim().toLowerCase();
  const allCraftable = items.filter(isCraftable);
  const craftable = primeOnly
    ? allCraftable.filter((item) => item.name.toLowerCase().includes("prime"))
    : allCraftable;

  let filtered;

  if (!query) {
    // No search: show a shuffled mix of featured items
    const featured = craftable.filter((item) => FEATURED_NAMES.has(item.name.toLowerCase()));
    const others = craftable.filter((item) => !FEATURED_NAMES.has(item.name.toLowerCase()));
    filtered = [...shuffleArray(featured), ...shuffleArray(others)].slice(0, limit);
  } else {
    filtered = craftable
      .filter((item) =>
        item.name.toLowerCase().includes(query) ||
        item.uniqueName.toLowerCase().includes(query),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit);
  }

  return filtered.map((item) => ({
    uniqueName: item.uniqueName,
    name: item.name,
    imageName: item.imageName,
    imageUrl: item.imageUrl,
    type: item.type,
    category: item.category,
    buildPrice: item.buildPrice || 0,
  }));
}

async function getItemByUniqueName(uniqueName) {
  const { itemMap } = await ensureDataLoaded();
  return itemMap.get(uniqueName) ?? null;
}

async function getItemMap() {
  const { itemMap } = await ensureDataLoaded();
  return itemMap;
}

function hasValidI18nCache() {
  return i18nCache.data && Date.now() - i18nCache.loadedAt < CACHE_TTL_MS;
}

async function fetchI18nFromRemote() {
  let lastError = null;

  for (const url of I18N_URLS) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const data = await fetchJsonWithTimeout(url);
      i18nCache = { loadedAt: Date.now(), data };
      return i18nCache;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("i18n sources are unavailable");
}

async function loadI18nFromSnapshot() {
  const raw = await fs.readFile(I18N_SNAPSHOT_PATH, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Local i18n snapshot is invalid");
  }

  i18nCache = { loadedAt: Date.now(), data: parsed };
  return i18nCache;
}

async function fetchI18nData() {
  try {
    return await fetchI18nFromRemote();
  } catch (remoteError) {
    try {
      const snapshotResult = await loadI18nFromSnapshot();
      console.warn("Using local i18n snapshot because remote fetch failed:", remoteError?.message || remoteError);
      return snapshotResult;
    } catch (snapshotError) {
      throw new Error(
        `i18n data could not be loaded. Remote error: ${remoteError?.message || remoteError}. Snapshot error: ${snapshotError?.message || snapshotError}`,
      );
    }
  }
}

async function ensureI18nLoaded() {
  if (hasValidI18nCache()) {
    return i18nCache;
  }

  if (!i18nLoadingPromise) {
    i18nLoadingPromise = fetchI18nData().finally(() => {
      i18nLoadingPromise = null;
    });
  }

  return i18nLoadingPromise;
}

async function getI18nForLanguage(lang) {
  const { data } = await ensureI18nLoaded();
  const names = {};

  for (const [uniqueName, translations] of Object.entries(data)) {
    if (translations[lang] && translations[lang].name) {
      names[uniqueName] = translations[lang].name;
    }
  }

  return names;
}

async function searchPrimeComponents(searchText = "", limit = 60) {
  const { items } = await ensureDataLoaded();
  const query = searchText.trim().toLowerCase();
  if (!query) return [];

  const primeItems = items.filter(
    (item) => isCraftable(item) && item.name.toLowerCase().includes("prime"),
  );

  // Common crafting materials to exclude from prime component search
  const materialKeywords = ["cell", "alloy", "ferrite", "polymer", "plastid", "salvage",
    "circuits", "rubedo", "morphics", "neurodes", "gallium", "tellurium", "oxium",
    "cryotic", "argon", "nitain", "forma", "orokin", "neural", "control module",
    "nano spores", "credits"];

  const results = [];
  for (const item of primeItems) {
    for (const comp of item.components) {
      const compLower = comp.name.toLowerCase();
      // Skip raw materials
      if (materialKeywords.some((kw) => compLower.includes(kw))) continue;
      if (
        compLower.includes(query) ||
        item.name.toLowerCase().includes(query)
      ) {
        results.push({
          uniqueName: comp.uniqueName,
          name: comp.name,
          itemCount: comp.itemCount ?? 1,
          parentUniqueName: item.uniqueName,
          parentName: item.name,
          parentImageUrl: item.imageUrl,
          parentCategory: item.category || item.type || null,
        });
      }
    }
  }

  results.sort((a, b) => a.name.localeCompare(b.name));
  return results.slice(0, limit);
}

const MASTERY_CATEGORIES = [
  { key: "Warframes", filter: (i) => i.category === "Warframes" },
  { key: "Primary", filter: (i) => i.category === "Primary" },
  { key: "Secondary", filter: (i) => i.category === "Secondary" },
  { key: "Melee", filter: (i) => i.category === "Melee" },
  { key: "Companions", filter: (i) => (i.category === "Pets" && i.type === "Pets") || i.category === "Sentinels" },
  { key: "Archwing", filter: (i) => i.category === "Archwing" },
  { key: "Arch-Gun", filter: (i) => i.category === "Arch-Gun" },
  { key: "Arch-Melee", filter: (i) => i.category === "Arch-Melee" },
];

async function getMasteryItems() {
  const { items } = await ensureDataLoaded();
  const result = {};
  for (const { key, filter } of MASTERY_CATEGORIES) {
    result[key] = items
      .filter(filter)
      .map((i) => ({
        uniqueName: i.uniqueName,
        name: i.name,
        imageName: i.imageName,
        imageUrl: i.imageUrl,
        type: i.type,
        category: i.category,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  return result;
}

// ---------------------------------------------------------------
// AMPS (Operator Amps)
// ---------------------------------------------------------------
// Community numbering from Quills / Vox Solaris unlock order:
// https://wiki.warframe.com/w/Amp
// Mote set = numberless starter kit.
const AMP_PRISM_ORDER = [
  "Raplak Prism",
  "Shwaak Prism",
  "Granmu Prism",
  "Rahn Prism",
  "Cantic Prism",
  "Lega Prism",
  "Klamora Prism",
];
const AMP_SCAFFOLD_ORDER = [
  "Pencha Scaffold",
  "Shraksun Scaffold",
  "Klebrik Scaffold",
  "Phahd Scaffold",
  "Exard Scaffold",
  "Dissic Scaffold",
  "Propa Scaffold",
];
const AMP_BRACE_ORDER = [
  "Clapkra Brace",
  "Juttni Brace",
  "Lohrin Brace",
  "Anspatha Brace",
  "Suo Brace",
  "Plaga Brace",
  "Certus Brace",
];

function simplifyAmpPart(item, number, slot) {
  // WFCD stores amp stats inside attacks[0] rather than top-level fields
  const attack = (Array.isArray(item.attacks) && item.attacks[0]) || {};
  const damageObj = attack.damage || {};
  const totalDmg = Object.values(damageObj).reduce(
    (a, b) => a + (Number(b) || 0),
    0,
  );

  return {
    uniqueName: item.uniqueName,
    name: item.name,
    slot,                       // "prism" | "scaffold" | "brace"
    number,                     // 1..7 or 0 for Mote
    imageName: item.imageName,
    imageUrl: item.imageUrl,
    damagePerShot: totalDmg,
    damageTypes: damageObj,     // e.g. { void: 3500 }
    totalDamage: totalDmg,
    criticalChance: (Number(attack.crit_chance) || 0) / 100,
    criticalMultiplier: Number(attack.crit_mult) || 0,
    procChance: (Number(attack.status_chance) || 0) / 100,
    fireRate: Number(attack.speed) || 0,
    masteryReq: Number(item.masteryReq) || 0,
    buildTime: item.buildTime,
    buildPrice: item.buildPrice,
    components: Array.isArray(item.components) ? item.components : [],
    description: item.description || null,
  };
}

// Raw-material search for Farm Planner. Returns { uniqueName, name, imageUrl }.
// Matches any resource/gem/plant whose name contains the query.
async function searchResources(query = "", limit = 20) {
  const { items } = await ensureDataLoaded();
  const q = query.trim().toLowerCase();
  const pool = items.filter(
    (item) => item.type === "Resource" || item.type === "Gem" || item.type === "Plant",
  );
  const hits = q
    ? pool.filter((item) => item.name.toLowerCase().includes(q))
    : pool;
  return hits
    .sort((a, b) => {
      // Exact name-start matches first
      const aStart = a.name.toLowerCase().startsWith(q) ? 0 : 1;
      const bStart = b.name.toLowerCase().startsWith(q) ? 0 : 1;
      if (aStart !== bStart) return aStart - bStart;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit)
    .map((item) => ({
      uniqueName: item.uniqueName,
      name: item.name,
      imageName: item.imageName,
      imageUrl: item.imageUrl,
      type: item.type,
    }));
}

async function getAmps() {
  const { items } = await ensureDataLoaded();
  const amps = items.filter((i) => i.type === "Amp");

  const findByName = (name) => amps.find((a) => a.name === name);

  const prisms = AMP_PRISM_ORDER
    .map((name, idx) => {
      const item = findByName(name);
      return item ? simplifyAmpPart(item, idx + 1, "prism") : null;
    })
    .filter(Boolean);

  const scaffolds = AMP_SCAFFOLD_ORDER
    .map((name, idx) => {
      const item = findByName(name);
      return item ? simplifyAmpPart(item, idx + 1, "scaffold") : null;
    })
    .filter(Boolean);

  const braces = AMP_BRACE_ORDER
    .map((name, idx) => {
      const item = findByName(name);
      return item ? simplifyAmpPart(item, idx + 1, "brace") : null;
    })
    .filter(Boolean);

  const motePrism = findByName("Mote Prism");
  const moteScaffold = findByName("Mote Scaffold");
  const moteBrace = findByName("Mote Brace");

  return {
    prisms,
    scaffolds,
    braces,
    mote: {
      prism: motePrism ? simplifyAmpPart(motePrism, 0, "prism") : null,
      scaffold: moteScaffold ? simplifyAmpPart(moteScaffold, 0, "scaffold") : null,
      brace: moteBrace ? simplifyAmpPart(moteBrace, 0, "brace") : null,
    },
  };
}

module.exports = {
  ensureDataLoaded,
  getItemByUniqueName,
  getItemMap,
  getI18nForLanguage,
  searchCraftableItems,
  searchPrimeComponents,
  getMasteryItems,
  getAmps,
  searchResources,
};


