import { create } from "zustand";
import type { PersistedState } from "../types";

type ClaimedMap = Record<string, number>;

interface WfRotationState {
  claimed: ClaimedMap;
  toggleClaim: (groupKey: string, warframeName: string) => void;
  setClaimed: (claimedOrFn: ClaimedMap | ((prev: ClaimedMap) => ClaimedMap)) => void;
  hydrate: (persisted: Pick<PersistedState, "wfRotationClaimed">) => void;
}

export const useWfRotationStore = create<WfRotationState>((set) => ({
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

  hydrate: (persisted) => set({ claimed: persisted.wfRotationClaimed || {} }),
}));

export function isClaimed(claimed: ClaimedMap, groupKey: string, warframeName: string): boolean {
  return Boolean(claimed[`${groupKey}:${warframeName}`]);
}
