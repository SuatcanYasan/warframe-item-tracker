import { themeOptions } from "../constants/themes";

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
    language: typeof navigator !== "undefined" && (navigator.language || "").startsWith("tr") ? "tr" : "en",
    theme: "orokin",
    customThemeTokens: themeOptions.orokin.token,
    themeProfiles: {},
    completionView: "all",
    selectedItems: [],
    activeKeys: [],
    completedMap: {},
    activeSelected: null,
    selectedCategoryFilter: "all",
    onboardingDone: false,
    panelWidths: { search: 20, selected: 45, totals: 35 },
    panelOrder: ["search", "selected", "totals"],
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
    language: next.language === "en" ? "en" : "tr",
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
          };
        })
      : [],
    activeKeys: Array.isArray(next.activeKeys) ? next.activeKeys : [],
    themeProfiles:
      next.themeProfiles && typeof next.themeProfiles === "object" ? next.themeProfiles : {},
    completedMap: next.completedMap && typeof next.completedMap === "object" ? next.completedMap : {},
    selectedCategoryFilter:
      typeof next.selectedCategoryFilter === "string" && next.selectedCategoryFilter.length > 0
        ? next.selectedCategoryFilter
        : "all",
    panelWidths:
      next.panelWidths && typeof next.panelWidths === "object" &&
      next.panelWidths.search && next.panelWidths.selected && next.panelWidths.totals
        ? next.panelWidths
        : fallback.panelWidths,
    panelOrder:
      Array.isArray(next.panelOrder) && next.panelOrder.length === 3 &&
      ["search", "selected", "totals"].every((id) => next.panelOrder.includes(id))
        ? next.panelOrder
        : fallback.panelOrder,
  };
}

export async function getPersistedState() {
  if (window.wfDesktop?.storage?.get) {
    try {
      const fromDesktop = await window.wfDesktop.storage.get();
      return normalizePersistedState(fromDesktop);
    } catch {
      return normalizePersistedState(readStorage());
    }
  }
  return normalizePersistedState(readStorage());
}

export async function savePersistedState(payload) {
  if (window.wfDesktop?.storage?.set) {
    try {
      await window.wfDesktop.storage.set(payload);
      return;
    } catch {
      // Fallback to localStorage when desktop save fails.
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
