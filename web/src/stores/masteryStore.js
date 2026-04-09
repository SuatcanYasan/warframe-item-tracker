import { create } from "zustand";

// States: undefined → "owned" → "mastered" → undefined (cycle)
export const useMasteryStore = create((set) => ({
  masteredItems: {},

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

  setMasteredItems: (itemsOrFn) =>
    set((state) => ({
      masteredItems:
        typeof itemsOrFn === "function"
          ? itemsOrFn(state.masteredItems)
          : itemsOrFn,
    })),

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
