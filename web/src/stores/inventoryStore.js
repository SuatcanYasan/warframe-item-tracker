import { create } from "zustand";

export const useInventoryStore = create((set) => ({
  inventoryParts: {},

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
      return {
        inventoryParts: {
          ...state.inventoryParts,
          [uniqueName]: { ...state.inventoryParts[uniqueName], quantity: qty },
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

  hydrate: (persisted) =>
    set({
      inventoryParts: persisted.inventoryParts,
    }),
}));
