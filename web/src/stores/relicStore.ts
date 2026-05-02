import { create } from "zustand";
import type { PersistedState } from "../types";

type FoundMap = Record<string, Record<string, boolean>>;

interface RelicState {
  foundComponents: FoundMap;
  toggleFound: (primeUniqueName: string, componentName: string) => void;
  setFoundComponents: (componentsOrFn: FoundMap | ((prev: FoundMap) => FoundMap)) => void;
  clearForItem: (uniqueName: string) => void;
  hydrate: (persisted: Pick<PersistedState, "relicFoundComponents">) => void;
}

export const useRelicStore = create<RelicState>((set) => ({
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

  hydrate: (persisted) => set({ foundComponents: persisted.relicFoundComponents || {} }),
}));
