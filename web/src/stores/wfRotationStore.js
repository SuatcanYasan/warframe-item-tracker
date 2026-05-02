import { create } from "zustand";

// Tracks which Warframe rotation picks the user has already claimed
// from the Steel Path Circuit weekly selection.
// keyed by `${groupKey}:${warframeName}` so the same warframe across
// different rotation weeks (which can't really happen, but defensive)
// stays distinct.
export const useWfRotationStore = create((set) => ({
  claimed: {},

  toggleClaim: (groupKey, warframeName) =>
    set((state) => {
      const k = `${groupKey}:${warframeName}`;
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
    set({ claimed: persisted.wfRotationClaimed || {} }),
}));

export function isClaimed(claimed, groupKey, warframeName) {
  return Boolean(claimed[`${groupKey}:${warframeName}`]);
}
