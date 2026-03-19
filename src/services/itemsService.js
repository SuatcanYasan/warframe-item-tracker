const ITEMS_URL = "https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/All.json";
const ITEM_IMAGE_BASE_URL = "https://raw.githubusercontent.com/WFCD/warframe-items/master/data/img";
const CACHE_TTL_MS = 1000 * 60 * 60 * 12;

let cache = {
  loadedAt: 0,
  items: null,
  itemMap: null,
};

let loadingPromise = null;

function normalizeItem(item) {
  const imageName = item.imageName || null;

  return {
    uniqueName: item.uniqueName,
    name: item.name,
    imageName,
    imageUrl: imageName ? `${ITEM_IMAGE_BASE_URL}/${encodeURIComponent(imageName)}` : null,
    type: item.type,
    category: item.category,
    buildTime: item.buildTime,
    buildPrice: item.buildPrice,
    buildQuantity: item.buildQuantity ?? 1,
    components: Array.isArray(item.components)
      ? item.components.map((component) => ({
          uniqueName: component.uniqueName,
          name: component.name,
          itemCount: component.itemCount ?? 1,
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

async function fetchAllItems() {
  const response = await fetch(ITEMS_URL);
  if (!response.ok) {
    throw new Error(`WFCD data fetch failed: ${response.status}`);
  }

  const rawItems = await response.json();
  const items = rawItems.map(normalizeItem);
  const itemMap = new Map(items.map((item) => [item.uniqueName, item]));

  cache = {
    loadedAt: Date.now(),
    items,
    itemMap,
  };

  return cache;
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

async function searchCraftableItems(searchText = "", limit = 30) {
  const { items } = await ensureDataLoaded();
  const query = searchText.trim().toLowerCase();

  const filtered = items
    .filter(isCraftable)
    .filter((item) => {
      if (!query) {
        return true;
      }

      return (
        item.name.toLowerCase().includes(query) ||
        item.uniqueName.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((item) => ({
      uniqueName: item.uniqueName,
      name: item.name,
      imageName: item.imageName,
      imageUrl: item.imageUrl,
      type: item.type,
      category: item.category,
    }));

  return filtered;
}

async function getItemByUniqueName(uniqueName) {
  const { itemMap } = await ensureDataLoaded();
  return itemMap.get(uniqueName) ?? null;
}

async function getItemMap() {
  const { itemMap } = await ensureDataLoaded();
  return itemMap;
}

module.exports = {
  ensureDataLoaded,
  getItemByUniqueName,
  getItemMap,
  searchCraftableItems,
};


