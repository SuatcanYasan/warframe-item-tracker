import { create } from "zustand";

// Tracks which Incarnon adapters the user has already claimed.
// keyed by `${groupKey}:${weaponName}` so the same weapon claimed on
// different rotation weeks (which can't actually happen, but defensive)
// stays distinct.
export const useIncarnonStore = create((set) => ({
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

  hydrate: (persisted) =>
    set({ claimed: persisted.incarnonClaimed || {} }),
}));

export function isClaimed(claimed, groupKey, weaponName) {
  return Boolean(claimed[`${groupKey}:${weaponName}`]);
}
