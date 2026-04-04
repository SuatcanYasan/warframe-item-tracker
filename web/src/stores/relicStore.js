import { create } from "zustand";

export const useRelicStore = create((set) => ({
  foundComponents: {},

  toggleFound: (primeUniqueName, componentName) =>
    set((state) => {
      const primeMap = { ...(state.foundComponents[primeUniqueName] || {}) };
      primeMap[componentName] = !primeMap[componentName];
      return {
        foundComponents: {
          ...state.foundComponents,
          [primeUniqueName]: primeMap,
        },
      };
    }),

  setFoundComponents: (componentsOrFn) =>
    set((state) => ({
      foundComponents:
        typeof componentsOrFn === "function"
          ? componentsOrFn(state.foundComponents)
          : componentsOrFn,
    })),

  clearForItem: (uniqueName) =>
    set((state) => {
      const next = { ...state.foundComponents };
      delete next[uniqueName];
      return { foundComponents: next };
    }),

  hydrate: (persisted) =>
    set({
      foundComponents: persisted.relicFoundComponents,
    }),
}));
