import { create } from "zustand";
import { themeOptions } from "../constants/themes";
import { detectBrowserLanguage } from "../constants/languages";
import type { PersistedState } from "../types";

export const APP_VERSION = "2.6.0";

type ThemeTokens = Record<string, unknown>;
type ThemeProfiles = Record<string, unknown>;

export interface SyncConflictPayload {
  local: PersistedState;
  cloud: PersistedState;
}

interface AppState {
  language: string;
  themeName: string;
  customThemeTokens: ThemeTokens;
  themeProfiles: ThemeProfiles;
  selectedProfileName: string;
  themeProfileInput: string;
  themeDrawerOpen: boolean;
  wizardOpen: boolean;
  shortcutsOpen: boolean;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  updateNotesOpen: boolean;
  storedVersion: string | null;
  shareModalOpen: boolean;
  pendingImportEncoded: string | null;
  syncConflict: SyncConflictPayload | null;
  setSyncConflict: (payload: SyncConflictPayload | null) => void;
  clearSyncConflict: () => void;
  setLanguage: (language: string) => void;
  setThemeName: (themeName: string) => void;
  setCustomThemeTokens: (tokensOrFn: ThemeTokens | ((prev: ThemeTokens) => ThemeTokens)) => void;
  setThemeProfiles: (profilesOrFn: ThemeProfiles | ((prev: ThemeProfiles) => ThemeProfiles)) => void;
  setSelectedProfileName: (name: string) => void;
  setThemeProfileInput: (input: string) => void;
  openThemeDrawer: () => void;
  closeThemeDrawer: () => void;
  openShortcuts: () => void;
  closeShortcuts: () => void;
  setWizardOpen: (open: boolean) => void;
  closeWizard: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;
  openUpdateNotes: () => void;
  closeUpdateNotes: () => void;
  setStoredVersion: (v: string | null) => void;
  openShareModal: () => void;
  closeShareModal: () => void;
  setPendingImport: (encoded: string | null) => void;
  clearPendingImport: () => void;
  hydrate: (persisted: PersistedState) => void;
}

export const useAppStore = create<AppState>((set) => ({
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
  pendingImportEncoded: null,

  syncConflict: null,
  setSyncConflict: (payload) => set({ syncConflict: payload }),
  clearSyncConflict: () => set({ syncConflict: null }),

  setLanguage: (language) => set({ language }),
  setThemeName: (themeName) => set({ themeName }),
  setCustomThemeTokens: (tokensOrFn) =>
    set((state) => ({
      customThemeTokens:
        typeof tokensOrFn === "function" ? tokensOrFn(state.customThemeTokens) : tokensOrFn,
    })),
  setThemeProfiles: (profilesOrFn) =>
    set((state) => ({
      themeProfiles:
        typeof profilesOrFn === "function" ? profilesOrFn(state.themeProfiles) : profilesOrFn,
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
