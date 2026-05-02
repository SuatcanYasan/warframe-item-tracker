import { create } from "zustand";
import type { PersistedState, MasteryStatus } from "../types";

type MasteredMap = Record<string, MasteryStatus>;

interface MasteryState {
  masteredItems: MasteredMap;
  multiSelectMode: boolean;
  multiSelectedIds: Set<string>;
  cycleStatus: (uniqueName: string) => void;
  setStatus: (uniqueName: string, status: MasteryStatus | null | undefined) => void;
  clearStatus: (uniqueName: string) => void;
  setMasteredItems: (itemsOrFn: MasteredMap | ((prev: MasteredMap) => MasteredMap)) => void;
  toggleMultiSelectMode: () => void;
  toggleMultiSelected: (uniqueName: string) => void;
  selectAllMulti: (uniqueNames: Iterable<string>) => void;
  clearMultiSelected: () => void;
  bulkSetStatus: (uniqueNames: Iterable<string>, status: MasteryStatus | null | undefined) => void;
  hydrate: (persisted: Pick<PersistedState, "masteredItems">) => void;
}

// States: undefined → "owned" → "mastered" → undefined (cycle)
export const useMasteryStore = create<MasteryState>((set) => ({
  masteredItems: {},

  multiSelectMode: false,
  multiSelectedIds: new Set<string>(),

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
    // Migrate old timestamp format → "mastered"
    const cleaned: MasteredMap = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v === "owned" || v === "mastered") cleaned[k] = v;
      else if (typeof v === "number") cleaned[k] = "mastered";
    }
    set({ masteredItems: cleaned });
  },
}));
