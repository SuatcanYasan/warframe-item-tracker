import { create } from "zustand";
import type { PersistedState } from "../types";

type ClaimedMap = Record<string, number>;

interface IncarnonState {
  claimed: ClaimedMap;
  toggleClaim: (groupKey: string, weaponName: string) => void;
  setClaimed: (claimedOrFn: ClaimedMap | ((prev: ClaimedMap) => ClaimedMap)) => void;
  hydrate: (persisted: Pick<PersistedState, "incarnonClaimed">) => void;
}

// Tracks which Incarnon adapters the user has already claimed.
// keyed by `${groupKey}:${weaponName}`.
export const useIncarnonStore = create<IncarnonState>((set) => ({
  claimed: {},

  toggleClaim: (groupKey, weaponName) =>
    set((state) => {
      const k = `${groupKey}:${weaponName}`;
      const next = { ...state.claimed };
      if (next[k]) delete next[k];
      else next[k] = Date.now();
      return { claimed: next };
    }),

  setClaimed: (claimedOrFn) =>
    set((state) => ({
      claimed:
        typeof claimedOrFn === "function" ? claimedOrFn(state.claimed) : claimedOrFn,
    })),

  hydrate: (persisted) => set({ claimed: persisted.incarnonClaimed || {} }),
}));

export function isClaimed(claimed: ClaimedMap, groupKey: string, weaponName: string): boolean {
  return Boolean(claimed[`${groupKey}:${weaponName}`]);
}
