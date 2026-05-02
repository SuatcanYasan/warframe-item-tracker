import { create } from "zustand";
import type { PersistedState, MasteryStatus, MasteryBreakdown } from "../types";

type MasteredMap = Record<string, MasteryStatus>;

interface MasteryState {
  masteredItems: MasteredMap;
  multiSelectMode: boolean;
  multiSelectedIds: Set<string>;
  // Real values from /api/profile/import — exact in-game MR, total mastery
  // XP (items + intrinsics + missions + junctions), per-source breakdown,
  // and when the import happened. These are ground truth; the per-item
  // estimate is only used when no profile has been imported.
  realMR: number | null;
  realTotalXp: number | null;
  realBreakdown: MasteryBreakdown | null;
  realDisplayName: string | null;
  lastImportAt: number | null;
  // 'manual' = user toggles items by hand. 'sync' = profile data
  // auto-refreshed every 5 min via /api/profile/import while the
  // mastery page is visible. Stored player ID drives the polling hook.
  mode: "manual" | "sync";
  syncPlayerId: string | null;
  setMode: (mode: "manual" | "sync") => void;
  setSyncPlayerId: (id: string | null) => void;
  cycleStatus: (uniqueName: string) => void;
  setStatus: (uniqueName: string, status: MasteryStatus | null | undefined) => void;
  clearStatus: (uniqueName: string) => void;
  setMasteredItems: (itemsOrFn: MasteredMap | ((prev: MasteredMap) => MasteredMap)) => void;
  setRealProfile: (
    mr: number | null,
    totalXp: number | null,
    breakdown?: MasteryBreakdown | null,
    importedAt?: number | null,
    displayName?: string | null,
  ) => void;
  clearRealProfile: () => void;
  toggleMultiSelectMode: () => void;
  toggleMultiSelected: (uniqueName: string) => void;
  selectAllMulti: (uniqueNames: Iterable<string>) => void;
  clearMultiSelected: () => void;
  bulkSetStatus: (uniqueNames: Iterable<string>, status: MasteryStatus | null | undefined) => void;
  hydrate: (persisted: Pick<PersistedState, "masteredItems"> & {
    masteryRealMR?: number | null;
    masteryRealTotalXp?: number | null;
    masteryRealBreakdown?: MasteryBreakdown | null;
    masteryLastImportAt?: number | null;
    masteryRealDisplayName?: string | null;
    masteryMode?: "manual" | "sync";
    masterySyncPlayerId?: string | null;
  }) => void;
}

// States: undefined → "owned" → "mastered" → undefined (cycle)
export const useMasteryStore = create<MasteryState>((set) => ({
  masteredItems: {},

  multiSelectMode: false,
  multiSelectedIds: new Set<string>(),
  realMR: null,
  realTotalXp: null,
  realBreakdown: null,
  realDisplayName: null,
  lastImportAt: null,
  mode: "manual",
  syncPlayerId: null,

  setMode: (mode) => set({ mode }),
  setSyncPlayerId: (id) => set({ syncPlayerId: id }),

  setRealProfile: (mr, totalXp, breakdown = null, importedAt = null, displayName) =>
    set((state) => ({
      realMR: mr,
      realTotalXp: totalXp,
      realBreakdown: breakdown,
      lastImportAt: importedAt ?? (mr != null ? Date.now() : null),
      // Preserve previous displayName when caller doesn't pass one
      // (e.g. snapshot restore from undo). Explicit null clears it.
      realDisplayName: displayName === undefined ? state.realDisplayName : displayName,
    })),
  clearRealProfile: () =>
    set({ realMR: null, realTotalXp: null, realBreakdown: null, realDisplayName: null, lastImportAt: null }),

  cycleStatus: (uniqueName) =>
    set((state) => {
      const next = { ...state.masteredItems };
      const current = next[uniqueName];
      if (!current) {
        next[uniqueName] = "owned";
      } else if (current === "owned") {
        next[uniqueName] = "mastered";
      } else {
        delete next[uniqueName];
      }
      return { masteredItems: next };
    }),

  setStatus: (uniqueName, status) =>
    set((state) => {
      const next = { ...state.masteredItems };
      if (!status) delete next[uniqueName];
      else next[uniqueName] = status;
      return { masteredItems: next };
    }),

  clearStatus: (uniqueName) =>
    set((state) => {
      if (!state.masteredItems[uniqueName]) return state;
      const next = { ...state.masteredItems };
      delete next[uniqueName];
      return { masteredItems: next };
    }),

  setMasteredItems: (itemsOrFn) =>
    set((state) => ({
      masteredItems:
        typeof itemsOrFn === "function"
          ? itemsOrFn(state.masteredItems)
          : itemsOrFn,
    })),

  toggleMultiSelectMode: () =>
    set((state) => ({
      multiSelectMode: !state.multiSelectMode,
      multiSelectedIds: new Set<string>(),
    })),
  toggleMultiSelected: (uniqueName) =>
    set((state) => {
      const next = new Set(state.multiSelectedIds);
      if (next.has(uniqueName)) next.delete(uniqueName);
      else next.add(uniqueName);
      return { multiSelectedIds: next };
    }),
  selectAllMulti: (uniqueNames) =>
    set(() => ({ multiSelectedIds: new Set(uniqueNames) })),
  clearMultiSelected: () => set({ multiSelectedIds: new Set<string>() }),

  bulkSetStatus: (uniqueNames, status) =>
    set((state) => {
      const next = { ...state.masteredItems };
      for (const id of uniqueNames) {
        if (status === null || status === undefined) delete next[id];
        else next[id] = status;
      }
      return {
        masteredItems: next,
        multiSelectedIds: new Set<string>(),
      };
    }),

  hydrate: (persisted) => {
    const raw = persisted?.masteredItems && typeof persisted.masteredItems === "object"
      ? persisted.masteredItems
      : {};
    const cleaned: MasteredMap = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v === "owned" || v === "mastered") cleaned[k] = v;
      else if (typeof v === "number") cleaned[k] = "mastered";
    }
    set({
      masteredItems: cleaned,
      realMR: typeof persisted.masteryRealMR === "number" ? persisted.masteryRealMR : null,
      realTotalXp: typeof persisted.masteryRealTotalXp === "number" ? persisted.masteryRealTotalXp : null,
      realBreakdown: persisted.masteryRealBreakdown ?? null,
      realDisplayName: typeof persisted.masteryRealDisplayName === "string" ? persisted.masteryRealDisplayName : null,
      lastImportAt: typeof persisted.masteryLastImportAt === "number" ? persisted.masteryLastImportAt : null,
      mode: persisted.masteryMode === "sync" ? "sync" : "manual",
      syncPlayerId:
        typeof persisted.masterySyncPlayerId === "string" && persisted.masterySyncPlayerId.length === 24
          ? persisted.masterySyncPlayerId
          : null,
    });
  },
}));
