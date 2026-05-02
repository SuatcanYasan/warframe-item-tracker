import { create } from "zustand";
import type { PersistedState } from "../types";

interface TrackedResource {
  uniqueName: string;
  name: string;
  imageUrl: string | null;
  imageUrlFallback: string | null;
  target: number;
}

interface AddResourceInput {
  uniqueName: string;
  name: string;
  imageUrl?: string | null;
  imageUrlFallback?: string | null;
}

interface FarmState {
  trackedResources: TrackedResource[];
  addResource: (resource: AddResourceInput, target?: number) => void;
  removeResource: (uniqueName: string) => void;
  updateTarget: (uniqueName: string, target: number) => void;
  clearAll: () => void;
  hydrate: (persisted: Pick<PersistedState, "farmResources">) => void;
}

export const useFarmStore = create<FarmState>((set) => ({
  trackedResources: [],

  addResource: (resource, target = 1) =>
    set((state) => {
      if (state.trackedResources.some((r) => r.uniqueName === resource.uniqueName)) return state;
      return {
        trackedResources: [
          ...state.trackedResources,
          {
            uniqueName: resource.uniqueName,
            name: resource.name,
            imageUrl: resource.imageUrl || null,
            imageUrlFallback: resource.imageUrlFallback || null,
            target: Math.max(1, Number(target) || 1),
          },
        ],
      };
    }),

  removeResource: (uniqueName) =>
    set((state) => ({
      trackedResources: state.trackedResources.filter((r) => r.uniqueName !== uniqueName),
    })),

  updateTarget: (uniqueName, target) =>
    set((state) => ({
      trackedResources: state.trackedResources.map((r) =>
        r.uniqueName === uniqueName ? { ...r, target: Math.max(1, Number(target) || 1) } : r,
      ),
    })),

  clearAll: () => set({ trackedResources: [] }),

  hydrate: (persisted) => {
    const raw = Array.isArray(persisted.farmResources) ? persisted.farmResources : [];
    const cleaned: TrackedResource[] = raw
      .filter((r): r is { uniqueName: string; name: string; imageUrl?: string | null; imageUrlFallback?: string | null; target?: number } =>
        Boolean(r && (r as { uniqueName?: unknown }).uniqueName && (r as { name?: unknown }).name),
      )
      .map((r) => ({
        uniqueName: r.uniqueName,
        name: r.name,
        imageUrl: r.imageUrl || null,
        imageUrlFallback: r.imageUrlFallback || null,
        target: Math.max(1, Number(r.target) || 1),
      }));
    set({ trackedResources: cleaned });
  },
}));
