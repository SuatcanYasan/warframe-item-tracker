import { create } from "zustand";

// Tracked sets model — each set is a full amp loadout the user wants to build.
// Each slot holds the part info + a per-part `done` flag the user can toggle
// as they craft the part. Set is considered complete when all 3 done=true.
export const useAmpStore = create((set) => ({
  trackedSets: [],  // [{ id, code, prism, scaffold, brace, createdAt }]

  // Per-part ownership for MR calculation: undefined | "owned" | "gilded"
  masteryParts: {},  // { [uniqueName]: "owned" | "gilded" }

  // Materials gathered toward tracked sets (per material uniqueName)
  completedMaterials: {},  // { [uniqueName]: true }

  toggleMaterialDone: (uniqueName) =>
    set((state) => {
      const next = { ...state.completedMaterials };
      if (next[uniqueName]) delete next[uniqueName];
      else next[uniqueName] = true;
      return { completedMaterials: next };
    }),

  clearCompletedMaterials: () => set({ completedMaterials: {} }),

  cycleMasteryStatus: (uniqueName) =>
    set((state) => {
      const next = { ...state.masteryParts };
      const current = next[uniqueName];
      if (!current) next[uniqueName] = "owned";
      else if (current === "owned") next[uniqueName] = "gilded";
      else delete next[uniqueName];
      return { masteryParts: next };
    }),

  addTrackedSet: ({ code, prism, scaffold, brace }) =>
    set((state) => {
      // Prevent duplicate tracking of the same combination code
      const exists = state.trackedSets.some((s) => s.code === code);
      if (exists) return state;
      return {
        trackedSets: [
          ...state.trackedSets,
          {
            id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
            code,
            prism: { ...prism, done: false },
            scaffold: { ...scaffold, done: false },
            brace: { ...brace, done: false },
            createdAt: Date.now(),
          },
        ],
      };
    }),

  removeTrackedSet: (id) =>
    set((state) => ({
      trackedSets: state.trackedSets.filter((s) => s.id !== id),
    })),

  togglePartDone: (setId, slot) =>
    set((state) => ({
      trackedSets: state.trackedSets.map((s) => {
        if (s.id !== setId) return s;
        const part = s[slot];
        if (!part) return s;
        return { ...s, [slot]: { ...part, done: !part.done } };
      }),
    })),

  clearAllTracked: () => set({ trackedSets: [] }),

  hydrate: (persisted) => {
    const raw = Array.isArray(persisted.trackedSets) ? persisted.trackedSets : [];
    const cleaned = raw.filter(
      (s) => s && s.id && s.code && s.prism && s.scaffold && s.brace,
    );
    const masteryRaw = persisted.masteryParts && typeof persisted.masteryParts === "object"
      ? persisted.masteryParts : {};
    const masteryCleaned = {};
    for (const [k, v] of Object.entries(masteryRaw)) {
      if (v === "owned" || v === "gilded") masteryCleaned[k] = v;
    }
    const materialsRaw = persisted.completedMaterials && typeof persisted.completedMaterials === "object"
      ? persisted.completedMaterials : {};
    const materialsCleaned = {};
    for (const [k, v] of Object.entries(materialsRaw)) {
      if (v === true) materialsCleaned[k] = true;
    }
    set({
      trackedSets: cleaned,
      masteryParts: masteryCleaned,
      completedMaterials: materialsCleaned,
    });
  },
}));
