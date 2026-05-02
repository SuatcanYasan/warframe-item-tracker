import { create } from "zustand";

// States: undefined → "owned" → "mastered" → undefined (cycle)
export const useMasteryStore = create((set) => ({
  masteredItems: {},

  // Multi-select mode for bulk operations.
  // ids are item uniqueNames; null status removes the entry.
  multiSelectMode: false,
  multiSelectedIds: new Set(),

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

  // Direct status setter — used by undo toast to restore a cleared status.
  setStatus: (uniqueName, status) =>
    set((state) => {
      const next = { ...state.masteredItems };
      if (!status) delete next[uniqueName];
      else next[uniqueName] = status;
      return { masteredItems: next };
    }),

  // Right-click handler — clear status regardless of current value.
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

  // ----- Multi-select actions -----
  toggleMultiSelectMode: () =>
    set((state) => ({
      multiSelectMode: !state.multiSelectMode,
      multiSelectedIds: new Set(),
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
  clearMultiSelected: () => set({ multiSelectedIds: new Set() }),

  // status: "owned" | "mastered" | null (clear)
  bulkSetStatus: (uniqueNames, status) =>
    set((state) => {
      const next = { ...state.masteredItems };
      for (const id of uniqueNames) {
        if (status === null || status === undefined) delete next[id];
        else next[id] = status;
      }
      return {
        masteredItems: next,
        multiSelectedIds: new Set(),  // clear selection after bulk action
      };
    }),

  hydrate: (persisted) => {
    const raw = persisted.masteredItems && typeof persisted.masteredItems === "object"
      ? persisted.masteredItems : {};
    // Migrate old timestamp format → "mastered"
    const cleaned = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v === "owned" || v === "mastered") cleaned[k] = v;
      else if (typeof v === "number") cleaned[k] = "mastered";
    }
    set({ masteredItems: cleaned });
  },
}));
