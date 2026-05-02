import { create } from "zustand";
import { ARCANE_MAX_COPIES } from "../constants/arcanes";

// Arcane copy tracker — { [arcaneId]: copyCount }.
// Players obtain duplicate copies of an arcane to level it from R0 to R5
// (max 21). We just store the count; rank progress is derived in the UI
// via getRequiredForRank().

function clampCount(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > ARCANE_MAX_COPIES) return ARCANE_MAX_COPIES;
  return Math.floor(n);
}

export const useArcaneStore = create((set) => ({
  arcaneCounts: {},

  setCount: (id, count) =>
    set((state) => {
      const safeCount = clampCount(count);
      const next = { ...state.arcaneCounts };
      if (safeCount === 0) delete next[id];
      else next[id] = safeCount;
      return { arcaneCounts: next };
    }),

  increment: (id, by = 1) =>
    set((state) => {
      const current = state.arcaneCounts[id] || 0;
      const safeCount = clampCount(current + by);
      const next = { ...state.arcaneCounts };
      if (safeCount === 0) delete next[id];
      else next[id] = safeCount;
      return { arcaneCounts: next };
    }),

  decrement: (id, by = 1) =>
    set((state) => {
      const current = state.arcaneCounts[id] || 0;
      const safeCount = clampCount(current - by);
      const next = { ...state.arcaneCounts };
      if (safeCount === 0) delete next[id];
      else next[id] = safeCount;
      return { arcaneCounts: next };
    }),

  clearAll: () => set({ arcaneCounts: {} }),

  hydrate: (persisted) => {
    const raw = persisted?.arcaneCounts;
    const cleaned = {};
    if (raw && typeof raw === "object") {
      for (const [id, value] of Object.entries(raw)) {
        const safeCount = clampCount(value);
        if (safeCount > 0) cleaned[id] = safeCount;
      }
    }
    set({ arcaneCounts: cleaned });
  },
}));
