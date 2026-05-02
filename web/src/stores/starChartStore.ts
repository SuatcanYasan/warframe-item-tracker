import { create } from "zustand";
import type { PersistedState } from "../types";

interface StarChartState {
  // Map of node key (e.g. "SolNode50") → completed flag. Sync mode
  // overwrites this from the latest profile pull.
  completed: Record<string, true>;
  toggle: (key: string) => void;
  setCompleted: (next: Record<string, true>) => void;
  hydrate: (
    persisted: Pick<PersistedState, never> & { starChartCompleted?: Record<string, true> },
  ) => void;
}

export const useStarChartStore = create<StarChartState>((set) => ({
  completed: {},
  toggle: (key) =>
    set((state) => {
      const next = { ...state.completed };
      if (next[key]) delete next[key];
      else next[key] = true;
      return { completed: next };
    }),
  setCompleted: (next) => set({ completed: { ...next } }),
  hydrate: (persisted) => {
    const raw = persisted?.starChartCompleted;
    const cleaned: Record<string, true> = {};
    if (raw && typeof raw === "object") {
      for (const [k, v] of Object.entries(raw)) {
        if (v === true) cleaned[k] = true;
      }
    }
    set({ completed: cleaned });
  },
}));
