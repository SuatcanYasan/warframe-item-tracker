import { create } from "zustand";
import { themeOptions } from "../constants/themes";

export const APP_VERSION = "2.3.0";

export const useAppStore = create((set) => ({
  language: "en",
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
