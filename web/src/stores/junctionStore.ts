import { create } from "zustand";
import type { PersistedState } from "../types";

interface JunctionState {
  // Map of junction key → completed flag. Keys come from /api/mastery/junctions
  // (e.g. "VenusJunction"). In sync mode this is overwritten by the
  // inferredJunctions from the latest profile pull.
  completed: Record<string, true>;
  toggle: (key: string) => void;
  setCompleted: (next: Record<string, true>) => void;
  hydrate: (
    persisted: Pick<PersistedState, never> & { junctionsCompleted?: Record<string, true> },
  ) => void;
}

export const useJunctionStore = create<JunctionState>((set) => ({
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
    const raw = persisted?.junctionsCompleted;
    const cleaned: Record<string, true> = {};
    if (raw && typeof raw === "object") {
      for (const [k, v] of Object.entries(raw)) {
        if (v === true) cleaned[k] = true;
      }
    }
    set({ completed: cleaned });
  },
}));
