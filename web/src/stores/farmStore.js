import { create } from "zustand";

// Tracked resources for Farm Planner:
// { uniqueName, name, imageUrl, target }  — target = how many you still need
export const useFarmStore = create((set) => ({
  trackedResources: [],

  addResource: (resource, target = 1) =>
    set((state) => {
      if (state.trackedResources.some((r) => r.uniqueName === resource.uniqueName)) {
        return state;
      }
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
    const cleaned = raw
      .filter((r) => r && r.uniqueName && r.name)
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
