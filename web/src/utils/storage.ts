import { themeOptions } from "../constants/themes";
import { detectBrowserLanguage } from "../constants/languages";
import type { PersistedState, CompletionView, SelectedCraftItem } from "../types";

const STORAGE_KEY = "wf-react-ui-v2";

export function readStorage(): unknown {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function createDefaultPersistedState(): PersistedState {
  return {
    language: detectBrowserLanguage(),
    theme: "orokin",
    customThemeTokens: themeOptions.orokin.token as Record<string, unknown>,
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
    wfRotationClaimed: {},
    arcaneCounts: {},
    masteryRealMR: null,
    masteryRealTotalXp: null,
    masteryRealBreakdown: null,
    masteryLastImportAt: null,
    masteryRealDisplayName: null,
    masteryMode: "manual",
    masterySyncPlayerId: null,
    storedVersion: null,
  };
}

const COMPLETION_VIEWS: CompletionView[] = ["all", "open", "done"];

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizePersistedState(raw: unknown): PersistedState {
  const fallback = createDefaultPersistedState();
  // Treat raw as a loose record — we validate every field ourselves.
  const next = { ...((raw as Record<string, unknown>) || {}) };
  const themeName = typeof next.theme === "string" && themeOptions[next.theme] ? next.theme : "orokin";
  const baseThemeToken = themeOptions[themeName].token as Record<string, unknown>;
  const persistedToken = isObjectRecord(next.customThemeTokens) ? next.customThemeTokens : {};

  return {
    ...fallback,
    ...next,
    language: typeof next.language === "string" && next.language ? next.language : fallback.language,
    theme: themeName,
    customThemeTokens: {
      ...baseThemeToken,
      ...persistedToken,
    },
    completionView: COMPLETION_VIEWS.includes(next.completionView as CompletionView)
      ? (next.completionView as CompletionView)
      : "all",
    selectedItems: Array.isArray(next.selectedItems)
      ? (next.selectedItems as Record<string, unknown>[]).map((item) => {
          const normalizedType =
            (item?.type as string) || (item?.subtitle as string) || (item?.category as string) || null;
          const normalizedCategory =
            (item?.category as string) || (item?.type as string) || (item?.subtitle as string) || null;
          return {
            ...(item as object),
            type: normalizedType,
            category: normalizedCategory,
            addedAt: typeof item?.addedAt === "number" ? (item.addedAt as number) : Date.now(),
          } as SelectedCraftItem;
        })
      : [],
    themeProfiles: isObjectRecord(next.themeProfiles) ? next.themeProfiles : {},
    completedMap: isObjectRecord(next.completedMap)
      ? (next.completedMap as Record<string, Record<string, number>>)
      : {},
    relicWatchedPrimes: Array.isArray(next.relicWatchedPrimes)
      ? (next.relicWatchedPrimes as string[])
      : [],
    relicFoundComponents: isObjectRecord(next.relicFoundComponents)
      ? (next.relicFoundComponents as Record<string, Record<string, boolean>>)
      : {},
    inventoryParts: isObjectRecord(next.inventoryParts)
      ? (next.inventoryParts as PersistedState["inventoryParts"])
      : {},
    masteredItems: isObjectRecord(next.masteredItems)
      ? (next.masteredItems as PersistedState["masteredItems"])
      : {},
    trackedSets: Array.isArray(next.trackedSets) ? (next.trackedSets as PersistedState["trackedSets"]) : [],
    masteryParts: isObjectRecord(next.masteryParts) ? next.masteryParts : {},
    completedMaterials: isObjectRecord(next.completedMaterials)
      ? (next.completedMaterials as Record<string, true>)
      : {},
    checklistItems: Array.isArray(next.checklistItems)
      ? (next.checklistItems as PersistedState["checklistItems"])
      : [],
    farmResources: Array.isArray(next.farmResources)
      ? (next.farmResources as PersistedState["farmResources"])
      : [],
    incarnonClaimed: isObjectRecord(next.incarnonClaimed)
      ? (next.incarnonClaimed as Record<string, number>)
      : {},
    wfRotationClaimed: isObjectRecord(next.wfRotationClaimed)
      ? (next.wfRotationClaimed as Record<string, number>)
      : {},
    arcaneCounts: isObjectRecord(next.arcaneCounts)
      ? (next.arcaneCounts as Record<string, number>)
      : {},
    masteryRealMR: typeof next.masteryRealMR === "number" ? next.masteryRealMR : null,
    masteryRealTotalXp: typeof next.masteryRealTotalXp === "number" ? next.masteryRealTotalXp : null,
    masteryRealBreakdown: isObjectRecord(next.masteryRealBreakdown)
      ? (next.masteryRealBreakdown as unknown as PersistedState["masteryRealBreakdown"])
      : null,
    masteryLastImportAt: typeof next.masteryLastImportAt === "number" ? next.masteryLastImportAt : null,
    masteryRealDisplayName:
      typeof next.masteryRealDisplayName === "string" && next.masteryRealDisplayName ? next.masteryRealDisplayName : null,
    masteryMode: next.masteryMode === "sync" ? "sync" : "manual",
    masterySyncPlayerId:
      typeof next.masterySyncPlayerId === "string" && next.masterySyncPlayerId.length === 24
        ? next.masterySyncPlayerId
        : null,
    storedVersion: typeof next.storedVersion === "string" ? next.storedVersion : null,
  };
}

export function getPersistedState(): PersistedState {
  return normalizePersistedState(readStorage());
}

export function savePersistedState(payload: PersistedState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
