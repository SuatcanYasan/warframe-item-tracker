import { create } from "zustand";

// Bumped whenever WFCD/warframe-items publishes new image hashes.
// On boot, if a stored craft item has a lower version, its imageUrl is
// re-fetched from /api/items/resolve-metadata so 403/404 placeholders go
// away without the user re-adding items.
export const CRAFT_IMAGE_MIGRATION_VERSION = 1;

export const useCraftStore = create((set, get) => ({
  selectedItems: [],
  completedMap: {},
  imageMigrationVersion: 0,
  setImageMigrationVersion: (v) => set({ imageMigrationVersion: v }),
  completionView: "all",
  calculation: { perItem: [], totals: [] },
  loadingCalc: false,

  searchDrawerOpen: false,
  activeTab: "selected",
  detailItem: null,
  detailMaterial: null,
  selectedSearch: "",
  selectedFilter: "all",
  selectedCategory: "all",
  totalsSearch: "",
  totalsFilter: "all",
  multiSelectMode: false,
  multiSelectedIds: new Set(),

  // State setters
  setSelectedItems: (itemsOrFn) =>
    set((state) => ({
      selectedItems:
        typeof itemsOrFn === "function"
          ? itemsOrFn(state.selectedItems)
          : itemsOrFn,
    })),
  setCompletedMap: (mapOrFn) =>
    set((state) => ({
      completedMap:
        typeof mapOrFn === "function"
          ? mapOrFn(state.completedMap)
          : mapOrFn,
    })),
  setCompletionView: (view) => set({ completionView: view }),
  setCalculation: (calc) => set({ calculation: calc }),
  setLoadingCalc: (loading) => set({ loadingCalc: loading }),

  setActiveTab: (tab) => set({ activeTab: tab }),
  setDetailItem: (item) => set({ detailItem: item }),
  setDetailMaterial: (material) => set({ detailMaterial: material }),
  openSearchDrawer: () => set({ searchDrawerOpen: true }),
  closeSearchDrawer: () => set({ searchDrawerOpen: false }),
  setSelectedSearch: (search) => set({ selectedSearch: search }),
  setSelectedFilter: (filter) => set({ selectedFilter: filter }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setTotalsSearch: (search) => set({ totalsSearch: search }),
  setTotalsFilter: (filter) => set({ totalsFilter: filter }),
  toggleMultiSelect: () => set((state) => ({ multiSelectMode: !state.multiSelectMode, multiSelectedIds: new Set() })),
  exitMultiSelect: () => set({ multiSelectMode: false, multiSelectedIds: new Set() }),
  toggleMultiId: (uniqueName) => set((state) => {
    const next = new Set(state.multiSelectedIds);
    if (next.has(uniqueName)) next.delete(uniqueName); else next.add(uniqueName);
    return { multiSelectedIds: next };
  }),
  selectAllMulti: (ids) => set({ multiSelectedIds: new Set(ids) }),
  clearMultiSelection: () => set({ multiSelectedIds: new Set() }),
  removeMultiSelected: () => set((state) => {
    const nextCompleted = { ...state.completedMap };
    state.multiSelectedIds.forEach((id) => delete nextCompleted[id]);
    return {
      selectedItems: state.selectedItems.filter((i) => !state.multiSelectedIds.has(i.uniqueName)),
      completedMap: nextCompleted,
      multiSelectedIds: new Set(),
      multiSelectMode: false,
    };
  }),

  // Business logic actions
  addItem: (item) => {
    set((state) => {
      const existing = state.selectedItems.find(
        (entry) => entry.uniqueName === item.uniqueName,
      );
      if (existing) {
        return {
          selectedItems: state.selectedItems.map((entry) =>
            entry.uniqueName === item.uniqueName
              ? {
                  ...entry,
                  quantity: entry.quantity + 1,
                  type: entry.type || item.type || item.category || null,
                  category: entry.category || item.category || item.type || null,
                }
              : entry,
          ),
        };
      }
      return {
        selectedItems: [
          ...state.selectedItems,
          {
            uniqueName: item.uniqueName,
            name: item.name,
            imageUrl: item.imageUrl || null,
            type: item.type || null,
            category: item.category || item.type || null,
            buildPrice: item.buildPrice || 0,
            quantity: 1,
            addedAt: Date.now(),
          },
        ],
      };
    });
  },

  removeItem: (uniqueName) => {
    set((state) => {
      const nextCompleted = { ...state.completedMap };
      delete nextCompleted[uniqueName];
      return {
        selectedItems: state.selectedItems.filter(
          (i) => i.uniqueName !== uniqueName,
        ),
        completedMap: nextCompleted,
      };
    });
  },

  updateQuantity: (uniqueName, quantity) => {
    set((state) => ({
      selectedItems: state.selectedItems.map((item) =>
        item.uniqueName === uniqueName
          ? { ...item, quantity: Math.max(1, Number(quantity) || 1) }
          : item,
      ),
    }));
  },

  reorderItems: (oldIndex, newIndex) =>
    set((state) => {
      if (
        oldIndex < 0 ||
        newIndex < 0 ||
        oldIndex >= state.selectedItems.length ||
        newIndex >= state.selectedItems.length ||
        oldIndex === newIndex
      ) {
        return state;
      }
      const items = [...state.selectedItems];
      const [moved] = items.splice(oldIndex, 1);
      items.splice(newIndex, 0, moved);
      return { selectedItems: items };
    }),

  setCompletedQuantity: (parentUniqueName, requirement, quantity) => {
    const normalized = Math.min(
      requirement.quantity,
      Math.max(0, Number(quantity) || 0),
    );
    set((state) => ({
      completedMap: {
        ...state.completedMap,
        [parentUniqueName]: {
          ...(state.completedMap[parentUniqueName] || {}),
          [requirement.uniqueName]: normalized,
        },
      },
    }));
  },

  bulkDonate: (resourceUniqueName, totalAmount, detailByItem) => {
    const { selectedItems, completedMap } = get();
    const consumers = [];
    for (const parent of selectedItems) {
      const requirements = detailByItem.get(parent.uniqueName) || [];
      const req = requirements.find((r) => r.uniqueName === resourceUniqueName);
      if (!req) continue;
      const alreadyCompleted = Math.min(
        req.quantity,
        Math.max(
          0,
          Number(completedMap[parent.uniqueName]?.[resourceUniqueName]) || 0,
        ),
      );
      const remaining = req.quantity - alreadyCompleted;
      if (remaining > 0) {
        consumers.push({
          parentUniqueName: parent.uniqueName,
          reqQuantity: req.quantity,
          alreadyCompleted,
          remaining,
        });
      }
    }
    if (consumers.length === 0) return;

    let left = totalAmount;
    set((state) => {
      const next = { ...state.completedMap };
      for (const c of consumers) {
        if (left <= 0) break;
        const give = Math.min(left, c.remaining);
        const newCompleted = Math.min(c.reqQuantity, c.alreadyCompleted + give);
        next[c.parentUniqueName] = {
          ...(next[c.parentUniqueName] || {}),
          [resourceUniqueName]: newCompleted,
        };
        left -= give;
      }
      return { completedMap: next };
    });
  },

  clearAll: () => {
    set({
      selectedItems: [],
      completedMap: {},
      detailItem: null,
      detailMaterial: null,
    });
  },

  hydrate: (persisted) =>
    set({
      selectedItems: persisted.selectedItems,
      completedMap: persisted.completedMap,
      completionView: persisted.completionView,
    }),
}));
