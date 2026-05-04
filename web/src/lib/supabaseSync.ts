// Multi-table cloud sync. Each logical store maps to a dedicated Postgres
// table. The strategy for every table is "snapshot upsert + delete missing":
//
//   1. Compute the current row set from Zustand state.
//   2. Upsert all current rows (on conflict → update).
//   3. Delete rows that were synced last time but aren't in the current state.
//
// A per-table Map of last-sent keys makes step 3 an in-memory diff — no extra
// round-trip to the DB to figure out what to delete.

import { supabase, SUPABASE_ENABLED } from "./supabase";
import { ensureSession } from "./supabaseAuth";
import { useAppStore } from "../stores/appStore";
import { useCraftStore } from "../stores/craftStore";
import { useRelicStore } from "../stores/relicStore";
import { useInventoryStore } from "../stores/inventoryStore";
import { useMasteryStore } from "../stores/masteryStore";
import { useAmpStore } from "../stores/ampStore";
import { useChecklistStore } from "../stores/checklistStore";
import { useFarmStore } from "../stores/farmStore";
import { useJunctionStore } from "../stores/junctionStore";
import { useIntrinsicStore } from "../stores/intrinsicStore";
import { useStarChartStore } from "../stores/starChartStore";
import type {
  PersistedState,
  SelectedCraftItem,
  InventoryPart,
  MasteryStatus,
  ChecklistItem,
  FarmResource,
} from "../types";

// ============================================================================
// Core helpers
// ============================================================================

type Row = Record<string, unknown>;

interface SyncResult {
  ok: boolean;
  reason?: string;
  skipped?: boolean;
}

interface SyncOptions {
  markOnly?: boolean;
}

const lastKeys = new Map<string, Set<string>>();
const lastHash = new Map<string, string>();
const KEY_SEP = "\x1f";

let bootstrapResolve: () => void;
const bootstrapReady: Promise<void> = new Promise((r) => {
  bootstrapResolve = r;
});
export function markBootstrapReady(): void {
  bootstrapResolve();
}
export function waitForBootstrap(): Promise<void> {
  return bootstrapReady;
}

function sortRowsDeterministic(rows: Row[], keyCols: string[]): Row[] {
  return [...rows].sort((a, b) => {
    for (const c of keyCols) {
      const d = String(a[c] ?? "").localeCompare(String(b[c] ?? ""));
      if (d) return d;
    }
    return 0;
  });
}

function compositeKey(row: Row, cols: string[]): string {
  return cols.map((c) => String(row[c] ?? "")).join(KEY_SEP);
}

async function requireUserId(): Promise<string | null> {
  if (!SUPABASE_ENABLED) return null;
  const session = await ensureSession();
  return session?.user?.id || null;
}

interface SyncTableArgs extends SyncOptions {
  table: string;
  rows: Row[];
  keyCols: string[];
}

async function syncTable({ table, rows, keyCols, markOnly = false }: SyncTableArgs): Promise<SyncResult> {
  const userId = await requireUserId();
  if (!userId || !supabase) return { ok: false, reason: "no-session" };

  const hash = JSON.stringify(sortRowsDeterministic(rows, keyCols));
  if (lastHash.get(table) === hash) return { ok: true, skipped: true };

  if (markOnly) {
    lastHash.set(table, hash);
    lastKeys.set(table, new Set(rows.map((r) => compositeKey(r, keyCols))));
    return { ok: true, skipped: true };
  }

  const current = new Set(rows.map((r) => compositeKey(r, keyCols)));
  const prev = lastKeys.get(table) || new Set<string>();
  const toDelete = [...prev].filter((k) => !current.has(k));

  // Pre-warm hash + keys BEFORE the network call. This way, the
  // Realtime echo (Supabase fires "row changed" events back at us
  // for our own writes) sees the already-updated hash and skips
  // the redundant pull-and-hydrate, which would otherwise repaint
  // each intermediate state during a bulk clear (333 deletes →
  // 333 separate UI repaints from 333 → 0).
  lastKeys.set(table, current);
  lastHash.set(table, hash);

  if (rows.length > 0) {
    const withUser = rows.map((r) => ({ user_id: userId, ...r }));
    const onConflict = ["user_id", ...keyCols].join(",");
    const { error } = await supabase.from(table).upsert(withUser, { onConflict });
    if (error) console.warn(`[sync:${table}] upsert:`, error.message);
  }

  // Batch deletes when possible. Single-key tables (most of them)
  // collapse to one `.in()` query; composite-key tables fall back to
  // per-row matches. Either way the upstream sees fewer transactions
  // → fewer Realtime events → no flicker on bulk clears.
  if (toDelete.length > 0) {
    if (keyCols.length === 1) {
      const col = keyCols[0];
      const values = toDelete.map((k) => k);
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("user_id", userId)
        .in(col, values);
      if (error) console.warn(`[sync:${table}] batch delete:`, error.message);
    } else {
      // Composite key — Supabase has no batch path for tuple matches,
      // so we still loop. This only affects craft_completed and
      // relic_found_components which rarely see bulk wipes.
      for (const k of toDelete) {
        const parts = k.split(KEY_SEP);
        const filter: Record<string, string> = { user_id: userId };
        keyCols.forEach((c, i) => { filter[c] = parts[i]; });
        const { error } = await supabase.from(table).delete().match(filter);
        if (error) console.warn(`[sync:${table}] delete:`, error.message);
      }
    }
  }
  return { ok: true };
}

interface PullTableResult {
  ok: boolean;
  rows: Row[];
}

async function pullTable(table: string, keyCols: string[]): Promise<PullTableResult> {
  const userId = await requireUserId();
  if (!userId || !supabase) return { ok: false, rows: [] };

  const { data, error } = await supabase.from(table).select("*").eq("user_id", userId);
  if (error) {
    console.warn(`[sync:${table}] pull:`, error.message);
    return { ok: false, rows: [] };
  }
  const rows = (data || []) as Row[];
  lastKeys.set(table, new Set(rows.map((r) => compositeKey(r, keyCols))));
  return { ok: true, rows };
}

// ============================================================================
// Per-store push/pull
// ============================================================================

interface ProfileInput {
  language?: string;
  themeName?: string;
  customThemeTokens?: unknown;
  themeProfiles?: unknown;
  completionView?: string;
  onboardingDone?: boolean;
  storedVersion?: string | null;
  // Profile-import fields. Optional — only present when the user ran
  // /api/profile/import. Stored on user_profiles as nullable columns
  // (added via migration: see SQL in repo docs).
  masteryRealMR?: number | null;
  masteryRealTotalXp?: number | null;
  masteryRealBreakdown?: unknown;
  masteryLastImportAt?: number | null;
  // Mastery v2 fields (mode toggle + sync player id + 3 sub-trackers).
  // Junctions/intrinsics/star-chart maps stored as JSONB. Mode + player
  // id as text columns. All nullable — empty maps treated as "unset".
  masteryRealDisplayName?: string | null;
  masteryMode?: "manual" | "sync";
  masterySyncPlayerId?: string | null;
  junctionsCompleted?: Record<string, true>;
  intrinsicRanks?: Record<string, number>;
  starChartCompleted?: Record<string, true>;
}

interface ProfileRow {
  language: string | null;
  theme_name: string | null;
  custom_theme_tokens: unknown;
  theme_profiles: unknown;
  completion_view: string | null;
  onboarding_done: boolean;
  stored_version: string | null;
  // Profile-import columns — populated only after the user runs import.
  // We always send them; if the SQL migration hasn't been applied,
  // Supabase rejects the unknown columns and we strip them on retry.
  mastery_real_mr?: number | null;
  mastery_real_total_xp?: number | null;
  mastery_real_breakdown?: unknown;
  mastery_last_import_at?: string | null;
  // Mastery v2 columns (added by migration). Same graceful-fallback
  // path strips them if the migration wasn't applied yet.
  mastery_real_display_name?: string | null;
  mastery_mode?: string | null;
  mastery_sync_player_id?: string | null;
  junctions_completed?: unknown;
  intrinsic_ranks?: unknown;
  star_chart_completed?: unknown;
}

// Supabase rejects upserts that reference columns that don't exist in
// the table. We attempt the full upsert first; on schema-mismatch error
// we strip the new mastery_real_* columns and retry — which keeps the
// app working even if the user hasn't run the SQL migration.
const PROFILE_IMPORT_COLUMNS = [
  "mastery_real_mr",
  "mastery_real_total_xp",
  "mastery_real_breakdown",
  "mastery_last_import_at",
  "mastery_real_display_name",
  "mastery_mode",
  "mastery_sync_player_id",
  "junctions_completed",
  "intrinsic_ranks",
  "star_chart_completed",
] as const;

function stripProfileImportColumns(row: ProfileRow): ProfileRow {
  const out = { ...row } as Record<string, unknown>;
  for (const c of PROFILE_IMPORT_COLUMNS) delete out[c];
  return out as unknown as ProfileRow;
}

export async function pushProfile(profile: ProfileInput, opts: SyncOptions = {}): Promise<SyncResult> {
  const userId = await requireUserId();
  if (!userId || !supabase) return { ok: false };
  const rowData: ProfileRow = {
    language: profile.language ?? null,
    theme_name: profile.themeName ?? null,
    custom_theme_tokens: profile.customThemeTokens ?? null,
    theme_profiles: profile.themeProfiles ?? null,
    completion_view: profile.completionView ?? null,
    onboarding_done: !!profile.onboardingDone,
    stored_version: profile.storedVersion ?? null,
    mastery_real_mr: profile.masteryRealMR ?? null,
    mastery_real_total_xp: profile.masteryRealTotalXp ?? null,
    mastery_real_breakdown: profile.masteryRealBreakdown ?? null,
    mastery_last_import_at: profile.masteryLastImportAt
      ? new Date(profile.masteryLastImportAt).toISOString()
      : null,
    mastery_real_display_name: profile.masteryRealDisplayName ?? null,
    mastery_mode: profile.masteryMode ?? null,
    mastery_sync_player_id: profile.masterySyncPlayerId ?? null,
    junctions_completed: profile.junctionsCompleted ?? null,
    intrinsic_ranks: profile.intrinsicRanks ?? null,
    star_chart_completed: profile.starChartCompleted ?? null,
  };
  const hash = JSON.stringify(rowData);
  if (lastHash.get("user_profiles") === hash) return { ok: true, skipped: true };
  if (opts.markOnly) {
    lastHash.set("user_profiles", hash);
    return { ok: true, skipped: true };
  }
  const { error } = await supabase
    .from("user_profiles")
    .upsert({ user_id: userId, ...rowData }, { onConflict: "user_id" });

  if (error) {
    // Likely cause: the mastery_real_* columns don't exist yet because
    // the SQL migration hasn't been applied. Strip them and retry — the
    // rest of the profile still syncs, just without the import fields.
    const isSchemaError = /column .*(mastery_|junctions_completed|intrinsic_ranks|star_chart_completed)/i.test(error.message || "")
      || /unknown column/i.test(error.message || "");
    if (isSchemaError) {
      const stripped = stripProfileImportColumns(rowData);
      const retry = await supabase
        .from("user_profiles")
        .upsert({ user_id: userId, ...stripped }, { onConflict: "user_id" });
      if (retry.error) console.warn("[sync:user_profiles] retry failed:", retry.error.message);
      lastHash.set("user_profiles", hash);
      return { ok: !retry.error };
    }
    console.warn("[sync:user_profiles] upsert:", error.message);
  }
  lastHash.set("user_profiles", hash);
  return { ok: !error };
}

export async function pullProfile(): Promise<ProfileRow | null> {
  const userId = await requireUserId();
  if (!userId || !supabase) return null;
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[sync:user_profiles] pull:", error.message);
    return null;
  }
  return (data as ProfileRow | null) || null;
}

// ----- craft_items -----
export async function pushCraftItems(
  selectedItems: SelectedCraftItem[] | undefined,
  opts: SyncOptions = {},
): Promise<SyncResult> {
  const rows: Row[] = (selectedItems || []).map((it) => ({
    unique_name: it.uniqueName,
    name: it.name,
    image_url: it.imageUrl || null,
    type: it.type || null,
    category: it.category || null,
    quantity: Number.isFinite(it.quantity) ? it.quantity : 1,
  }));
  return syncTable({ table: "craft_items", rows, keyCols: ["unique_name"], ...opts });
}

export async function pullCraftItems(): Promise<SelectedCraftItem[]> {
  const { rows } = await pullTable("craft_items", ["unique_name"]);
  return rows.map((r) => ({
    uniqueName: r.unique_name as string,
    name: r.name as string,
    imageUrl: (r.image_url as string | null) || null,
    type: (r.type as string | null) || null,
    category: (r.category as string | null) || null,
    quantity: (r.quantity as number) ?? 1,
    addedAt: r.added_at ? new Date(r.added_at as string).getTime() : Date.now(),
  }));
}

// ----- craft_completed (nested map → flat rows) -----
export async function pushCraftCompleted(
  completedMap: Record<string, Record<string, number>> | undefined,
  opts: SyncOptions = {},
): Promise<SyncResult> {
  const rows: Row[] = [];
  for (const [item, reqs] of Object.entries(completedMap || {})) {
    for (const [req, qty] of Object.entries(reqs || {})) {
      const q = Number(qty) || 0;
      if (q > 0) rows.push({ item_unique_name: item, req_unique_name: req, quantity: q });
    }
  }
  return syncTable({
    table: "craft_completed",
    rows,
    keyCols: ["item_unique_name", "req_unique_name"],
    ...opts,
  });
}

export async function pullCraftCompleted(): Promise<Record<string, Record<string, number>>> {
  const { rows } = await pullTable("craft_completed", ["item_unique_name", "req_unique_name"]);
  const out: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    const item = r.item_unique_name as string;
    const req = r.req_unique_name as string;
    if (!out[item]) out[item] = {};
    out[item][req] = (r.quantity as number) ?? 0;
  }
  return out;
}

// ----- relic_found_components -----
export async function pushRelicFound(
  foundComponents: Record<string, Record<string, boolean>> | undefined,
  opts: SyncOptions = {},
): Promise<SyncResult> {
  const rows: Row[] = [];
  for (const [prime, comps] of Object.entries(foundComponents || {})) {
    for (const [comp, isFound] of Object.entries(comps || {})) {
      if (isFound) rows.push({ prime_unique_name: prime, component_name: comp, is_found: true });
    }
  }
  return syncTable({
    table: "relic_found_components",
    rows,
    keyCols: ["prime_unique_name", "component_name"],
    ...opts,
  });
}

export async function pullRelicFound(): Promise<Record<string, Record<string, boolean>>> {
  const { rows } = await pullTable("relic_found_components", ["prime_unique_name", "component_name"]);
  const out: Record<string, Record<string, boolean>> = {};
  for (const r of rows) {
    if (!r.is_found) continue;
    const prime = r.prime_unique_name as string;
    const comp = r.component_name as string;
    if (!out[prime]) out[prime] = {};
    out[prime][comp] = true;
  }
  return out;
}

// ----- inventory_parts -----
export async function pushInventoryParts(
  parts: Record<string, InventoryPart> | undefined,
  opts: SyncOptions = {},
): Promise<SyncResult> {
  const rows: Row[] = Object.values(parts || {})
    .filter((p) => p?.uniqueName && Number(p.quantity) > 0)
    .map((p) => ({
      unique_name: p.uniqueName,
      name: p.name || null,
      parent_unique_name: p.parentUniqueName || null,
      parent_name: p.parentName || null,
      parent_image_url: p.parentImageUrl || null,
      parent_category: p.parentCategory || null,
      quantity: Number(p.quantity) || 0,
    }));
  return syncTable({ table: "inventory_parts", rows, keyCols: ["unique_name"], ...opts });
}

export async function pullInventoryParts(): Promise<Record<string, InventoryPart>> {
  const { rows } = await pullTable("inventory_parts", ["unique_name"]);
  const out: Record<string, InventoryPart> = {};
  for (const r of rows) {
    const un = r.unique_name as string;
    out[un] = {
      uniqueName: un,
      name: r.name as string,
      parentUniqueName: r.parent_unique_name as string,
      parentName: r.parent_name as string,
      parentImageUrl: (r.parent_image_url as string | null) || null,
      parentCategory: (r.parent_category as string | null) || null,
      quantity: (r.quantity as number) ?? 0,
    };
  }
  return out;
}

// ----- mastered_items -----
export async function pushMasteredItems(
  items: Record<string, MasteryStatus> | undefined,
  opts: SyncOptions = {},
): Promise<SyncResult> {
  const rows: Row[] = Object.entries(items || {})
    .filter(([, status]) => status === "owned" || status === "mastered")
    .map(([uniqueName, status]) => ({ unique_name: uniqueName, status }));
  return syncTable({ table: "mastered_items", rows, keyCols: ["unique_name"], ...opts });
}

export async function pullMasteredItems(): Promise<Record<string, MasteryStatus>> {
  const { rows } = await pullTable("mastered_items", ["unique_name"]);
  const out: Record<string, MasteryStatus> = {};
  for (const r of rows) out[r.unique_name as string] = r.status as MasteryStatus;
  return out;
}

// ----- tracked_amp_sets -----
interface AmpSetInput {
  id: string | number;
  code?: string | null;
  prism?: unknown;
  scaffold?: unknown;
  brace?: unknown;
}

export async function pushAmpSets(sets: AmpSetInput[] | undefined, opts: SyncOptions = {}): Promise<SyncResult> {
  const rows: Row[] = (sets || []).map((s) => ({
    set_id: String(s.id),
    code: s.code || null,
    prism: s.prism || null,
    scaffold: s.scaffold || null,
    brace: s.brace || null,
  }));
  return syncTable({ table: "tracked_amp_sets", rows, keyCols: ["set_id"], ...opts });
}

export async function pullAmpSets(): Promise<unknown[]> {
  const { rows } = await pullTable("tracked_amp_sets", ["set_id"]);
  return rows.map((r) => ({
    id: r.set_id,
    code: r.code,
    prism: r.prism,
    scaffold: r.scaffold,
    brace: r.brace,
    createdAt: r.created_at ? new Date(r.created_at as string).getTime() : Date.now(),
  }));
}

// ----- amp_mastery_parts -----
type AmpMasteryStatus = "owned" | "gilded";

export async function pushAmpMasteryParts(
  parts: Record<string, AmpMasteryStatus> | undefined,
  opts: SyncOptions = {},
): Promise<SyncResult> {
  const rows: Row[] = Object.entries(parts || {})
    .filter(([, status]) => status === "owned" || status === "gilded")
    .map(([uniqueName, status]) => ({ unique_name: uniqueName, status }));
  return syncTable({ table: "amp_mastery_parts", rows, keyCols: ["unique_name"], ...opts });
}

export async function pullAmpMasteryParts(): Promise<Record<string, AmpMasteryStatus>> {
  const { rows } = await pullTable("amp_mastery_parts", ["unique_name"]);
  const out: Record<string, AmpMasteryStatus> = {};
  for (const r of rows) out[r.unique_name as string] = r.status as AmpMasteryStatus;
  return out;
}

// ----- amp_completed_materials -----
export async function pushAmpMaterials(
  materials: Record<string, true> | undefined,
  opts: SyncOptions = {},
): Promise<SyncResult> {
  const rows: Row[] = Object.entries(materials || {})
    .filter(([, val]) => !!val)
    .map(([uniqueName]) => ({ unique_name: uniqueName }));
  return syncTable({ table: "amp_completed_materials", rows, keyCols: ["unique_name"], ...opts });
}

export async function pullAmpMaterials(): Promise<Record<string, true>> {
  const { rows } = await pullTable("amp_completed_materials", ["unique_name"]);
  const out: Record<string, true> = {};
  for (const r of rows) out[r.unique_name as string] = true;
  return out;
}

// ----- checklist_items -----
export async function pushChecklist(items: ChecklistItem[] | undefined, opts: SyncOptions = {}): Promise<SyncResult> {
  const rows: Row[] = (items || []).map((i) => ({
    item_id: String(i.id),
    text: i.text || "",
    type: i.type === "weekly" ? "weekly" : "daily",
    done_for_period: i.doneForPeriod || null,
    is_preset: !!i.isPreset,
  }));
  return syncTable({ table: "checklist_items", rows, keyCols: ["item_id"], ...opts });
}

export async function pullChecklist(): Promise<ChecklistItem[]> {
  const { rows } = await pullTable("checklist_items", ["item_id"]);
  return rows.map((r) => ({
    id: r.item_id as string,
    text: r.text as string,
    type: r.type as ChecklistItem["type"],
    doneForPeriod: (r.done_for_period as string | undefined) || undefined,
    isPreset: !!r.is_preset,
  }));
}

// ----- farm_resources -----
export async function pushFarmResources(
  resources: FarmResource[] | undefined,
  opts: SyncOptions = {},
): Promise<SyncResult> {
  const rows: Row[] = (resources || []).map((r) => {
    const rec = r as FarmResource & { imageUrlFallback?: string | null; target?: number };
    return {
      unique_name: rec.uniqueName,
      name: rec.name,
      image_url: rec.imageUrl || null,
      image_url_fallback: rec.imageUrlFallback || null,
      target: Math.max(1, Number(rec.target) || 1),
    };
  });
  return syncTable({ table: "farm_resources", rows, keyCols: ["unique_name"], ...opts });
}

export async function pullFarmResources(): Promise<FarmResource[]> {
  const { rows } = await pullTable("farm_resources", ["unique_name"]);
  return rows.map((r) => ({
    uniqueName: r.unique_name as string,
    name: r.name as string,
    imageUrl: (r.image_url as string | null) || null,
    imageUrlFallback: (r.image_url_fallback as string | null) || null,
    target: (r.target as number) ?? 1,
  })) as FarmResource[];
}

// ============================================================================
// Aggregate helpers — used on bootstrap / migration / full refresh.
// ============================================================================

export interface PullAllStateResult {
  empty: boolean;
  state?: Partial<PersistedState>;
}

export async function pullAllState(): Promise<PullAllStateResult | null> {
  if (!SUPABASE_ENABLED) return null;
  const userId = await requireUserId();
  if (!userId) return null;

  const [
    profile, craftItems, craftCompleted, relicFound, inventoryParts, masteredItems,
    ampSets, ampMasteryParts, ampMaterials, checklist, farm,
  ] = await Promise.all([
    pullProfile(), pullCraftItems(), pullCraftCompleted(), pullRelicFound(),
    pullInventoryParts(), pullMasteredItems(), pullAmpSets(), pullAmpMasteryParts(),
    pullAmpMaterials(), pullChecklist(), pullFarmResources(),
  ]);

  const cloudHasData =
    profile ||
    craftItems.length > 0 ||
    Object.keys(craftCompleted).length > 0 ||
    Object.keys(relicFound).length > 0 ||
    Object.keys(inventoryParts).length > 0 ||
    Object.keys(masteredItems).length > 0 ||
    ampSets.length > 0 ||
    Object.keys(ampMasteryParts).length > 0 ||
    Object.keys(ampMaterials).length > 0 ||
    checklist.length > 0 ||
    farm.length > 0;
  if (!cloudHasData) return { empty: true };

  return {
    empty: false,
    state: {
      language: profile?.language ?? undefined,
      theme: profile?.theme_name ?? undefined,
      customThemeTokens: (profile?.custom_theme_tokens as Record<string, unknown> | undefined),
      themeProfiles: (profile?.theme_profiles as Record<string, unknown> | undefined),
      completionView: (profile?.completion_view as PersistedState["completionView"] | undefined),
      onboardingDone: !!profile?.onboarding_done,
      storedVersion: profile?.stored_version || null,
      masteryRealMR: typeof profile?.mastery_real_mr === "number" ? profile.mastery_real_mr : null,
      masteryRealTotalXp: typeof profile?.mastery_real_total_xp === "number" ? profile.mastery_real_total_xp : null,
      masteryRealBreakdown: (profile?.mastery_real_breakdown as PersistedState["masteryRealBreakdown"]) ?? null,
      masteryLastImportAt: profile?.mastery_last_import_at
        ? new Date(profile.mastery_last_import_at as string).getTime()
        : null,
      masteryRealDisplayName: typeof profile?.mastery_real_display_name === "string" ? profile.mastery_real_display_name : null,
      masteryMode: profile?.mastery_mode === "sync" ? "sync" : "manual",
      masterySyncPlayerId: typeof profile?.mastery_sync_player_id === "string" ? profile.mastery_sync_player_id : null,
      junctionsCompleted: (profile?.junctions_completed as Record<string, true> | undefined) ?? {},
      intrinsicRanks: (profile?.intrinsic_ranks as Record<string, number> | undefined) ?? {},
      starChartCompleted: (profile?.star_chart_completed as Record<string, true> | undefined) ?? {},
      selectedItems: craftItems,
      completedMap: craftCompleted,
      relicFoundComponents: relicFound,
      inventoryParts,
      masteredItems,
      trackedSets: ampSets,
      masteryParts: ampMasteryParts,
      completedMaterials: ampMaterials,
      checklistItems: checklist,
      farmResources: farm,
    } as Partial<PersistedState>,
  };
}

export async function pushAllState(
  payload: PersistedState,
  opts: SyncOptions = {},
): Promise<SyncResult> {
  if (!SUPABASE_ENABLED) return { ok: false };
  await Promise.all([
    pushProfile(
      {
        language: payload.language,
        themeName: payload.theme,
        customThemeTokens: payload.customThemeTokens,
        themeProfiles: payload.themeProfiles,
        completionView: payload.completionView,
        onboardingDone: payload.onboardingDone,
        storedVersion: payload.storedVersion,
        masteryRealMR: payload.masteryRealMR ?? null,
        masteryRealTotalXp: payload.masteryRealTotalXp ?? null,
        masteryRealBreakdown: payload.masteryRealBreakdown ?? null,
        masteryLastImportAt: payload.masteryLastImportAt ?? null,
        masteryRealDisplayName: payload.masteryRealDisplayName ?? null,
        masteryMode: payload.masteryMode,
        masterySyncPlayerId: payload.masterySyncPlayerId ?? null,
        junctionsCompleted: payload.junctionsCompleted ?? {},
        intrinsicRanks: payload.intrinsicRanks ?? {},
        starChartCompleted: payload.starChartCompleted ?? {},
      },
      opts,
    ),
    pushCraftItems(payload.selectedItems, opts),
    pushCraftCompleted(payload.completedMap, opts),
    pushRelicFound(payload.relicFoundComponents, opts),
    pushInventoryParts(payload.inventoryParts, opts),
    pushMasteredItems(payload.masteredItems, opts),
    pushAmpSets(payload.trackedSets as AmpSetInput[], opts),
    pushAmpMasteryParts(payload.masteryParts as Record<string, AmpMasteryStatus>, opts),
    pushAmpMaterials(payload.completedMaterials, opts),
    pushChecklist(payload.checklistItems, opts),
    pushFarmResources(payload.farmResources, opts),
  ]);
  return { ok: true };
}

// ============================================================================
// Per-table Realtime subscription with partial hydration.
// ============================================================================

const tableTimers = new Map<string, ReturnType<typeof setTimeout>>();

function debouncedPull(table: string, handler: () => Promise<void>, delay = 200): void {
  if (tableTimers.get(table)) return;
  tableTimers.set(
    table,
    setTimeout(async () => {
      tableTimers.delete(table);
      try {
        await handler();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`[sync:${table}] hydrate:`, msg);
      }
    }, delay),
  );
}

const perTableHydrators: Record<string, () => Promise<void>> = {
  user_profiles: async () => {
    const p = await pullProfile();
    if (!p) return;
    const rowData = {
      language: p.language ?? null,
      theme_name: p.theme_name ?? null,
      custom_theme_tokens: p.custom_theme_tokens ?? null,
      theme_profiles: p.theme_profiles ?? null,
      completion_view: p.completion_view ?? null,
      onboarding_done: !!p.onboarding_done,
      stored_version: p.stored_version ?? null,
      mastery_real_mr: p.mastery_real_mr ?? null,
      mastery_real_total_xp: p.mastery_real_total_xp ?? null,
      mastery_real_breakdown: p.mastery_real_breakdown ?? null,
      mastery_last_import_at: p.mastery_last_import_at ?? null,
      mastery_real_display_name: p.mastery_real_display_name ?? null,
      mastery_mode: p.mastery_mode ?? null,
      mastery_sync_player_id: p.mastery_sync_player_id ?? null,
      junctions_completed: p.junctions_completed ?? null,
      intrinsic_ranks: p.intrinsic_ranks ?? null,
      star_chart_completed: p.star_chart_completed ?? null,
    };
    const hash = JSON.stringify(rowData);
    if (lastHash.get("user_profiles") === hash) return;
    lastHash.set("user_profiles", hash);
    useAppStore.setState({
      language: p.language || useAppStore.getState().language,
      themeName: p.theme_name || useAppStore.getState().themeName,
      customThemeTokens:
        (p.custom_theme_tokens as Record<string, unknown>) || useAppStore.getState().customThemeTokens,
      themeProfiles: (p.theme_profiles as Record<string, unknown>) || {},
      storedVersion: p.stored_version || null,
    });
    useCraftStore.setState({
      completionView: (p.completion_view as PersistedState["completionView"]) || "all",
    });
    // Hydrate profile-import scalars on the mastery store so MR Calculator
    // picks up cross-device changes via Realtime.
    useMasteryStore.setState({
      realMR: typeof p.mastery_real_mr === "number" ? p.mastery_real_mr : null,
      realTotalXp: typeof p.mastery_real_total_xp === "number" ? p.mastery_real_total_xp : null,
      realBreakdown: (p.mastery_real_breakdown as PersistedState["masteryRealBreakdown"]) ?? null,
      lastImportAt: p.mastery_last_import_at
        ? new Date(p.mastery_last_import_at as string).getTime()
        : null,
      realDisplayName: typeof p.mastery_real_display_name === "string" ? p.mastery_real_display_name : null,
      mode: p.mastery_mode === "sync" ? "sync" : "manual",
      syncPlayerId: typeof p.mastery_sync_player_id === "string" ? p.mastery_sync_player_id : null,
    });
    useJunctionStore.getState().setCompleted(
      (p.junctions_completed as Record<string, true> | undefined) ?? {},
    );
    useIntrinsicStore.getState().setAll(
      (p.intrinsic_ranks as Record<string, number> | undefined) ?? {},
    );
    useStarChartStore.getState().setCompleted(
      (p.star_chart_completed as Record<string, true> | undefined) ?? {},
    );
  },
  craft_items: async () => {
    const items = await pullCraftItems();
    await pushCraftItems(items, { markOnly: true });
    useCraftStore.setState({ selectedItems: items });
  },
  craft_completed: async () => {
    const map = await pullCraftCompleted();
    await pushCraftCompleted(map, { markOnly: true });
    useCraftStore.setState({ completedMap: map });
  },
  relic_found_components: async () => {
    const found = await pullRelicFound();
    await pushRelicFound(found, { markOnly: true });
    useRelicStore.setState({ foundComponents: found });
  },
  inventory_parts: async () => {
    const parts = await pullInventoryParts();
    await pushInventoryParts(parts, { markOnly: true });
    useInventoryStore.setState({ inventoryParts: parts });
  },
  mastered_items: async () => {
    const items = await pullMasteredItems();
    await pushMasteredItems(items, { markOnly: true });
    useMasteryStore.setState({ masteredItems: items });
  },
  tracked_amp_sets: async () => {
    const sets = await pullAmpSets();
    await pushAmpSets(sets as AmpSetInput[], { markOnly: true });
    // Cast through unknown — ampStore's TrackedSet type is richer than what
    // the realtime hydration round-trips; treat as opaque here.
    useAmpStore.setState({ trackedSets: sets } as Parameters<typeof useAmpStore.setState>[0]);
  },
  amp_mastery_parts: async () => {
    const parts = await pullAmpMasteryParts();
    await pushAmpMasteryParts(parts, { markOnly: true });
    useAmpStore.setState({ masteryParts: parts });
  },
  amp_completed_materials: async () => {
    const mats = await pullAmpMaterials();
    await pushAmpMaterials(mats, { markOnly: true });
    useAmpStore.setState({ completedMaterials: mats });
  },
  checklist_items: async () => {
    const items = await pullChecklist();
    await pushChecklist(items, { markOnly: true });
    useChecklistStore.setState({ items });
  },
  farm_resources: async () => {
    const resources = await pullFarmResources();
    await pushFarmResources(resources, { markOnly: true });
    // farmStore expects TrackedResource (with non-optional target/imageUrlFallback).
    // Pull always provides those fields with defaults — cast through unknown.
    useFarmStore.setState({ trackedResources: resources } as Parameters<typeof useFarmStore.setState>[0]);
  },
};

export async function subscribeWithHydrate(): Promise<() => void> {
  if (!SUPABASE_ENABLED || !supabase) return () => {};
  const userId = await requireUserId();
  if (!userId) return () => {};

  const channel = supabase.channel(`wit-sync:${userId}`);
  for (const [table, handler] of Object.entries(perTableHydrators)) {
    channel.on(
      "postgres_changes" as "system",
      { event: "*", schema: "public", table, filter: `user_id=eq.${userId}` },
      () => debouncedPull(table, handler),
    );
  }
  channel.subscribe();

  return () => {
    for (const t of tableTimers.values()) clearTimeout(t);
    tableTimers.clear();
    if (supabase) supabase.removeChannel(channel);
  };
}
