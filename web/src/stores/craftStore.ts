import { create } from "zustand";
import type { PersistedState, SelectedCraftItem, CompletionView } from "../types";
import type { Requirement } from "../utils/helpers";

// Bumped whenever WFCD/warframe-items publishes new image hashes.
// On boot, if a stored craft item has a lower version, its imageUrl is
// re-fetched from /api/items/resolve-metadata so 403/404 placeholders go
// away without the user re-adding items.
export const CRAFT_IMAGE_MIGRATION_VERSION = 1;

type CompletedMap = Record<string, Record<string, number>>;

interface AddItemInput {
  uniqueName: string;
  name: string;
  imageUrl?: string | null;
  type?: string | null;
  category?: string | null;
  buildPrice?: number;
}

interface Calculation {
  perItem: unknown[];
  totals: unknown[];
}

type Filter = "all" | "open" | "done";

interface CraftState {
  selectedItems: SelectedCraftItem[];
  completedMap: CompletedMap;
  imageMigrationVersion: number;
  setImageMigrationVersion: (v: number) => void;
  completionView: CompletionView;
  calculation: Calculation;
  loadingCalc: boolean;

  searchDrawerOpen: boolean;
  activeTab: "selected" | "totals";
  detailItem: SelectedCraftItem | null;
  detailMaterial: { uniqueName: string; name: string; quantity: number } | null;
  selectedSearch: string;
  selectedFilter: Filter;
  selectedCategory: string;
  totalsSearch: string;
  totalsFilter: Filter;
  multiSelectMode: boolean;
  multiSelectedIds: Set<string>;

  setSelectedItems: (itemsOrFn: SelectedCraftItem[] | ((prev: SelectedCraftItem[]) => SelectedCraftItem[])) => void;
  setCompletedMap: (mapOrFn: CompletedMap | ((prev: CompletedMap) => CompletedMap)) => void;
  setCompletionView: (view: CompletionView) => void;
  setCalculation: (calc: Calculation) => void;
  setLoadingCalc: (loading: boolean) => void;

  setActiveTab: (tab: "selected" | "totals") => void;
  setDetailItem: (item: SelectedCraftItem | null) => void;
  setDetailMaterial: (material: { uniqueName: string; name: string; quantity: number } | null) => void;
  openSearchDrawer: () => void;
  closeSearchDrawer: () => void;
  setSelectedSearch: (search: string) => void;
  setSelectedFilter: (filter: Filter) => void;
  setSelectedCategory: (category: string) => void;
  setTotalsSearch: (search: string) => void;
  setTotalsFilter: (filter: Filter) => void;
  toggleMultiSelect: () => void;
  exitMultiSelect: () => void;
  toggleMultiId: (uniqueName: string) => void;
  selectAllMulti: (ids: Iterable<string>) => void;
  clearMultiSelection: () => void;
  removeMultiSelected: () => void;

  addItem: (item: AddItemInput) => void;
  removeItem: (uniqueName: string) => void;
  updateQuantity: (uniqueName: string, quantity: number) => void;
  reorderItems: (oldIndex: number, newIndex: number) => void;
  setCompletedQuantity: (parentUniqueName: string, requirement: Requirement, quantity: number) => void;
  bulkDonate: (
    resourceUniqueName: string,
    totalAmount: number,
    detailByItem: Map<string, Requirement[]>,
  ) => void;
  clearAll: () => void;
  hydrate: (persisted: Pick<PersistedState, "selectedItems" | "completedMap" | "completionView">) => void;
}

export const useCraftStore = create<CraftState>((set, get) => ({
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
  multiSelectedIds: new Set<string>(),

  setSelectedItems: (itemsOrFn) =>
    set((state) => ({
      selectedItems: typeof itemsOrFn === "function" ? itemsOrFn(state.selectedItems) : itemsOrFn,
    })),
  setCompletedMap: (mapOrFn) =>
    set((state) => ({
      completedMap: typeof mapOrFn === "function" ? mapOrFn(state.completedMap) : mapOrFn,
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
  toggleMultiSelect: () =>
    set((state) => ({ multiSelectMode: !state.multiSelectMode, multiSelectedIds: new Set<string>() })),
  exitMultiSelect: () => set({ multiSelectMode: false, multiSelectedIds: new Set<string>() }),
  toggleMultiId: (uniqueName) =>
    set((state) => {
      const next = new Set(state.multiSelectedIds);
      if (next.has(uniqueName)) next.delete(uniqueName);
      else next.add(uniqueName);
      return { multiSelectedIds: next };
    }),
  selectAllMulti: (ids) => set({ multiSelectedIds: new Set(ids) }),
  clearMultiSelection: () => set({ multiSelectedIds: new Set<string>() }),
  removeMultiSelected: () =>
    set((state) => {
      const nextCompleted = { ...state.completedMap };
      state.multiSelectedIds.forEach((id) => delete nextCompleted[id]);
      return {
        selectedItems: state.selectedItems.filter((i) => !state.multiSelectedIds.has(i.uniqueName)),
        completedMap: nextCompleted,
        multiSelectedIds: new Set<string>(),
        multiSelectMode: false,
      };
    }),

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
        selectedItems: state.selectedItems.filter((i) => i.uniqueName !== uniqueName),
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
    const consumers: { parentUniqueName: string; reqQuantity: number; alreadyCompleted: number; remaining: number }[] = [];
    for (const parent of selectedItems) {
      const requirements = detailByItem.get(parent.uniqueName) || [];
      const req = requirements.find((r) => r.uniqueName === resourceUniqueName);
      if (!req) continue;
      const alreadyCompleted = Math.min(
        req.quantity,
        Math.max(0, Number(completedMap[parent.uniqueName]?.[resourceUniqueName]) || 0),
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
      selectedItems: persisted.selectedItems || [],
      completedMap: persisted.completedMap || {},
      completionView: persisted.completionView || "all",
    }),
}));
