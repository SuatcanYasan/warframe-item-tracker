import { create } from "zustand";
import type { PersistedState } from "../types";

interface IntrinsicState {
  // Map of intrinsic key (e.g. "tactical") → rank 0-10. Sync mode
  // overwrites the whole map from the latest profile pull.
  ranks: Record<string, number>;
  setRank: (key: string, rank: number) => void;
  setAll: (next: Record<string, number>) => void;
  hydrate: (
    persisted: Pick<PersistedState, never> & { intrinsicRanks?: Record<string, number> },
  ) => void;
}

export const useIntrinsicStore = create<IntrinsicState>((set) => ({
  ranks: {},
  setRank: (key, rank) =>
    set((state) => ({ ranks: { ...state.ranks, [key]: Math.max(0, Math.min(10, rank | 0)) } })),
  setAll: (next) => set({ ranks: { ...next } }),
  hydrate: (persisted) => {
    const raw = persisted?.intrinsicRanks;
    const cleaned: Record<string, number> = {};
    if (raw && typeof raw === "object") {
      for (const [k, v] of Object.entries(raw)) {
        if (typeof v === "number" && v >= 0) cleaned[k] = Math.min(10, v | 0);
      }
    }
    set({ ranks: cleaned });
  },
}));
