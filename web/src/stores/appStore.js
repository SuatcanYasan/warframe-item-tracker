import { create } from "zustand";
import { themeOptions } from "../constants/themes";
import { detectBrowserLanguage } from "../constants/languages";

export const APP_VERSION = "2.6.0";

export const useAppStore = create((set) => ({
  language: detectBrowserLanguage(),
  themeName: "orokin",
  customThemeTokens: themeOptions.orokin.token,
  themeProfiles: {},
  selectedProfileName: "",
  themeProfileInput: "",
  themeDrawerOpen: false,
  wizardOpen: false,
  shortcutsOpen: false,
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  updateNotesOpen: false,
  storedVersion: null,

  shareModalOpen: false,
  pendingImportEncoded: null,  // set when app launches with #share=... hash

  // Sign-in conflict — set during bootstrap when local and cloud both have
  // data and they differ. The modal asks the user to pick one source.
  // Shape: { local: persistedShape, cloud: persistedShape } | null
  syncConflict: null,
  setSyncConflict: (payload) => set({ syncConflict: payload }),
  clearSyncConflict: () => set({ syncConflict: null }),

  setLanguage: (language) => set({ language }),
  setThemeName: (themeName) => set({ themeName }),
  setCustomThemeTokens: (tokensOrFn) =>
    set((state) => ({
      customThemeTokens:
        typeof tokensOrFn === "function"
          ? tokensOrFn(state.customThemeTokens)
          : tokensOrFn,
    })),
  setThemeProfiles: (profilesOrFn) =>
    set((state) => ({
      themeProfiles:
        typeof profilesOrFn === "function"
          ? profilesOrFn(state.themeProfiles)
          : profilesOrFn,
    })),
  setSelectedProfileName: (name) => set({ selectedProfileName: name }),
  setThemeProfileInput: (input) => set({ themeProfileInput: input }),
  openThemeDrawer: () => set({ themeDrawerOpen: true }),
  closeThemeDrawer: () => set({ themeDrawerOpen: false }),
  openShortcuts: () => set({ shortcutsOpen: true }),
  closeShortcuts: () => set({ shortcutsOpen: false }),
  setWizardOpen: (open) => set({ wizardOpen: open }),
  closeWizard: () => set({ wizardOpen: false }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  openMobileSidebar: () => set({ mobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
  toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
  openUpdateNotes: () => set({ updateNotesOpen: true }),
  closeUpdateNotes: () => set({ updateNotesOpen: false, storedVersion: APP_VERSION }),
  setStoredVersion: (v) => set({ storedVersion: v }),
  openShareModal: () => set({ shareModalOpen: true }),
  closeShareModal: () => set({ shareModalOpen: false }),
  setPendingImport: (encoded) => set({ pendingImportEncoded: encoded, shareModalOpen: true }),
  clearPendingImport: () => set({ pendingImportEncoded: null }),

  hydrate: (persisted) => {
    const versionMismatch = persisted.storedVersion !== APP_VERSION;
    set({
      language: persisted.language,
      themeName: persisted.theme,
      customThemeTokens: persisted.customThemeTokens,
      themeProfiles: persisted.themeProfiles,
      wizardOpen: !persisted.onboardingDone,
      storedVersion: persisted.storedVersion || null,
      updateNotesOpen: versionMismatch && persisted.onboardingDone,
    });
  },
}));
