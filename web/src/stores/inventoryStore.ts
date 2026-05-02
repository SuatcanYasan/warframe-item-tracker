import { create } from "zustand";
import type { PersistedState, InventoryPart } from "../types";

export const INVENTORY_IMAGE_MIGRATION_VERSION = 1;

type PartsMap = Record<string, InventoryPart>;

interface AddPartInput {
  uniqueName: string;
  name: string;
  parentUniqueName: string;
  parentName: string;
  parentImageUrl: string | null;
  parentCategory?: string | null;
}

interface InventoryState {
  inventoryParts: PartsMap;
  imageMigrationVersion: number;
  setImageMigrationVersion: (v: number) => void;
  addPart: (comp: AddPartInput, quantity: number) => void;
  updateQty: (uniqueName: string, qty: number) => void;
  removePart: (uniqueName: string) => void;
  setInventoryParts: (partsOrFn: PartsMap | ((prev: PartsMap) => PartsMap)) => void;
  hydrate: (persisted: Pick<PersistedState, "inventoryParts">) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  inventoryParts: {},
  imageMigrationVersion: 0,
  setImageMigrationVersion: (v) => set({ imageMigrationVersion: v }),

  addPart: (comp, quantity) =>
    set((state) => ({
      inventoryParts: {
        ...state.inventoryParts,
        [comp.uniqueName]: {
          uniqueName: comp.uniqueName,
          name: comp.name,
          parentUniqueName: comp.parentUniqueName,
          parentName: comp.parentName,
          parentImageUrl: comp.parentImageUrl,
          parentCategory: comp.parentCategory,
          quantity:
            (state.inventoryParts[comp.uniqueName]?.quantity || 0) + quantity,
        },
      },
    })),

  updateQty: (uniqueName, qty) =>
    set((state) => {
      if (qty <= 0) {
        const next = { ...state.inventoryParts };
        delete next[uniqueName];
        return { inventoryParts: next };
      }
      const existing = state.inventoryParts[uniqueName];
      if (!existing) return state;
      return {
        inventoryParts: {
          ...state.inventoryParts,
          [uniqueName]: { ...existing, quantity: qty },
        },
      };
    }),

  removePart: (uniqueName) =>
    set((state) => {
      const next = { ...state.inventoryParts };
      delete next[uniqueName];
      return { inventoryParts: next };
    }),

  setInventoryParts: (partsOrFn) =>
    set((state) => ({
      inventoryParts:
        typeof partsOrFn === "function"
          ? partsOrFn(state.inventoryParts)
          : partsOrFn,
    })),

  hydrate: (persisted) => set({ inventoryParts: persisted.inventoryParts || {} }),
}));
