import { create } from "zustand";
import type { PersistedState } from "../types";

type AmpSlot = "prism" | "scaffold" | "brace";
type AmpMasteryStatus = "owned" | "gilded";

interface AmpPart {
  uniqueName: string;
  name: string;
  imageUrl?: string | null;
  done: boolean;
  [key: string]: unknown;
}

interface TrackedSet {
  id: string;
  code: string;
  prism: AmpPart;
  scaffold: AmpPart;
  brace: AmpPart;
  createdAt: number;
}

interface AddTrackedSetInput {
  code: string;
  prism: Omit<AmpPart, "done">;
  scaffold: Omit<AmpPart, "done">;
  brace: Omit<AmpPart, "done">;
}

interface AmpState {
  trackedSets: TrackedSet[];
  masteryParts: Record<string, AmpMasteryStatus>;
  completedMaterials: Record<string, true>;
  toggleMaterialDone: (uniqueName: string) => void;
  clearCompletedMaterials: () => void;
  cycleMasteryStatus: (uniqueName: string) => void;
  addTrackedSet: (input: AddTrackedSetInput) => void;
  removeTrackedSet: (id: string) => void;
  togglePartDone: (setId: string, slot: AmpSlot) => void;
  clearAllTracked: () => void;
  hydrate: (persisted: Pick<PersistedState, "trackedSets" | "masteryParts" | "completedMaterials">) => void;
}

export const useAmpStore = create<AmpState>((set) => ({
  trackedSets: [],
  masteryParts: {},
  completedMaterials: {},

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
      if (state.trackedSets.some((s) => s.code === code)) return state;
      const newSet: TrackedSet = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        code,
        prism: { ...prism, done: false } as AmpPart,
        scaffold: { ...scaffold, done: false } as AmpPart,
        brace: { ...brace, done: false } as AmpPart,
        createdAt: Date.now(),
      };
      return { trackedSets: [...state.trackedSets, newSet] };
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
      (s): s is TrackedSet =>
        Boolean(
          s &&
            (s as { id?: unknown }).id &&
            (s as { code?: unknown }).code &&
            (s as { prism?: unknown }).prism &&
            (s as { scaffold?: unknown }).scaffold &&
            (s as { brace?: unknown }).brace,
        ),
    );
    const masteryRaw =
      persisted.masteryParts && typeof persisted.masteryParts === "object"
        ? (persisted.masteryParts as Record<string, unknown>)
        : {};
    const masteryCleaned: Record<string, AmpMasteryStatus> = {};
    for (const [k, v] of Object.entries(masteryRaw)) {
      if (v === "owned" || v === "gilded") masteryCleaned[k] = v;
    }
    const materialsRaw =
      persisted.completedMaterials && typeof persisted.completedMaterials === "object"
        ? (persisted.completedMaterials as Record<string, unknown>)
        : {};
    const materialsCleaned: Record<string, true> = {};
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
