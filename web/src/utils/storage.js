import { themeOptions } from "../constants/themes";
import { detectBrowserLanguage } from "../constants/languages";

const STORAGE_KEY = "wf-react-ui-v2";

export function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function createDefaultPersistedState() {
  return {
    language: detectBrowserLanguage(),
    theme: "orokin",
    customThemeTokens: themeOptions.orokin.token,
    themeProfiles: {},
    completionView: "all",
    selectedItems: [],
    completedMap: {},
    onboardingDone: false,
    relicWatchedPrimes: [],
    relicFoundComponents: {},
    inventoryParts: {},
    masteredItems: {},
    trackedSets: [],
    masteryParts: {},
    completedMaterials: {},
    checklistItems: [],
    farmResources: [],
    incarnonClaimed: {},
    storedVersion: null,
  };
}

export function normalizePersistedState(raw) {
  const fallback = createDefaultPersistedState();
  const next = { ...(raw || {}) };
  const normalizedThemeName = themeOptions[next.theme] ? next.theme : "orokin";
  const baseThemeToken = themeOptions[normalizedThemeName].token;
  const persistedToken =
    next.customThemeTokens && typeof next.customThemeTokens === "object" ? next.customThemeTokens : {};

  return {
    ...fallback,
    ...next,
    language: next.language || fallback.language,
    theme: normalizedThemeName,
    customThemeTokens: {
      ...baseThemeToken,
      ...persistedToken,
    },
    completionView: ["all", "open", "done"].includes(next.completionView)
      ? next.completionView
      : "all",
    selectedItems: Array.isArray(next.selectedItems)
      ? next.selectedItems.map((item) => {
          const normalizedType = item?.type || item?.subtitle || item?.category || null;
          const normalizedCategory = item?.category || item?.type || item?.subtitle || null;
          return {
            ...item,
            type: normalizedType,
            category: normalizedCategory,
            addedAt: typeof item?.addedAt === "number" ? item.addedAt : Date.now(),
          };
        })
      : [],
    themeProfiles:
      next.themeProfiles && typeof next.themeProfiles === "object" ? next.themeProfiles : {},
    completedMap: next.completedMap && typeof next.completedMap === "object" ? next.completedMap : {},
    relicWatchedPrimes: Array.isArray(next.relicWatchedPrimes) ? next.relicWatchedPrimes : [],
    relicFoundComponents:
      next.relicFoundComponents && typeof next.relicFoundComponents === "object"
        ? next.relicFoundComponents
        : {},
    inventoryParts:
      next.inventoryParts && typeof next.inventoryParts === "object"
        ? next.inventoryParts
        : {},
    masteredItems:
      next.masteredItems && typeof next.masteredItems === "object"
        ? next.masteredItems
        : {},
    trackedSets: Array.isArray(next.trackedSets) ? next.trackedSets : [],
    masteryParts:
      next.masteryParts && typeof next.masteryParts === "object" ? next.masteryParts : {},
    completedMaterials:
      next.completedMaterials && typeof next.completedMaterials === "object"
        ? next.completedMaterials
        : {},
    checklistItems: Array.isArray(next.checklistItems) ? next.checklistItems : [],
    farmResources: Array.isArray(next.farmResources) ? next.farmResources : [],
    incarnonClaimed:
      next.incarnonClaimed && typeof next.incarnonClaimed === "object" ? next.incarnonClaimed : {},
    storedVersion: next.storedVersion || null,
  };
}

export function getPersistedState() {
  return normalizePersistedState(readStorage());
}

export function savePersistedState(payload) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
