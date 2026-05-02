// Central type definitions used across stores, hooks, and persistence.
// Keep these stable — they're the contract between layers.

// ---- Persisted state shape ----
// Mirrors what's stored in localStorage and synced to Supabase.

export interface SelectedCraftItem {
  uniqueName: string;
  name: string;
  imageUrl: string | null;
  type: string | null;
  category: string | null;
  buildPrice?: number;
  quantity: number;
  addedAt: number;
}

export interface InventoryPart {
  uniqueName: string;
  name: string;
  parentUniqueName: string;
  parentName: string;
  parentImageUrl: string | null;
  parentCategory?: string | null;
  quantity: number;
}

export type MasteryStatus = "owned" | "mastered";

export interface ChecklistItem {
  id: string;
  text: string;
  type: "daily" | "weekly";
  isPreset?: boolean;
  doneForPeriod?: string;
}

export interface FarmResource {
  uniqueName: string;
  name: string;
  quantity?: number;
  imageUrl?: string | null;
}

// AmpTrackedSet shape is owned by ampStore — keeping this opaque here
// avoids tight coupling and lets persisted slices accept the richer
// in-store shape (parts with `done` flags, createdAt, etc.).
export type AmpTrackedSet = unknown;

export type CompletionView = "all" | "open" | "done";

export interface PersistedState {
  language: string;
  theme: string;
  customThemeTokens: Record<string, unknown>;
  themeProfiles: Record<string, unknown>;
  completionView: CompletionView;
  selectedItems: SelectedCraftItem[];
  completedMap: Record<string, Record<string, number>>;
  onboardingDone: boolean;
  relicWatchedPrimes: string[];
  relicFoundComponents: Record<string, Record<string, boolean>>;
  inventoryParts: Record<string, InventoryPart>;
  masteredItems: Record<string, MasteryStatus>;
  // AmpTrackedSet has a complex per-slot shape — keep loose to avoid
  // tight coupling between the persistence boundary and the in-memory
  // store representation (which carries methods, `done` flags, etc.).
  trackedSets: AmpTrackedSet[];
  masteryParts: Record<string, unknown>;
  // Amp's "I have collected this material" map — value is `true` flag
  // (not nested counts like craft completedMap).
  completedMaterials: Record<string, true>;
  checklistItems: ChecklistItem[];
  farmResources: FarmResource[];
  incarnonClaimed: Record<string, number>;
  wfRotationClaimed: Record<string, number>;
  arcaneCounts: Record<string, number>;
  // Real MR + total XP from /api/profile/import (DE proxy). Optional —
  // only populated after the user runs the profile import flow. The
  // MR Calculator prefers these over its own per-item estimate.
  masteryRealMR?: number | null;
  masteryRealTotalXp?: number | null;
  /** Per-source breakdown of realTotalXp (items / intrinsics / starChart / junctions). */
  masteryRealBreakdown?: MasteryBreakdown | null;
  /** ms-since-epoch when the profile was last imported. */
  masteryLastImportAt?: number | null;
  /** In-game display name from the imported profile (e.g. "IlyadaCreative"). */
  masteryRealDisplayName?: string | null;
  /** Mastery page interaction mode. 'manual' = user toggles by hand,
   *  'sync' = profile data auto-refreshed every 5 min while page is visible. */
  masteryMode?: "manual" | "sync";
  /** Player ID stored for the sync mode auto-refresh poll. */
  masterySyncPlayerId?: string | null;
  /** Junction completion map (key like "VenusJunction" → true). */
  junctionsCompleted?: Record<string, true>;
  /** Intrinsic ranks (key like "tactical" → 0-10). */
  intrinsicRanks?: Record<string, number>;
  /** Star chart node completion map (key like "SolNode50" → true). */
  starChartCompleted?: Record<string, true>;
  storedVersion: string | null;
}

export interface MasteryBreakdown {
  items: number;
  intrinsics: number;
  starChart: number;
  junctions: number;
  intrinsicRankTotal: number;
  missionCount: number;
}

// ---- Mastery item (from API) ----
export interface MasteryItem {
  uniqueName: string;
  name: string;
  imageUrl: string | null;
  type?: string;
  category?: string;
}

// ---- Theme tokens ----
export interface ThemeTokenSet {
  colorPrimary: string;
  colorBgBase: string;
  colorBgContainer: string;
  colorText: string;
  colorTextSecondary: string;
  colorBorder: string;
  colorSuccess?: string;
  colorWarning?: string;
  colorError?: string;
  borderRadius?: number;
  scrollbarColor?: string;
}
