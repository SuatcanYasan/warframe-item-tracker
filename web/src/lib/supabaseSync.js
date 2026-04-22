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

// ============================================================================
// Core helpers
// ============================================================================

// Last-seen keys per table — used to compute what to DELETE on the next push.
const lastKeys = new Map();
// Last-sent hash per table — used to short-circuit pushes when nothing
// changed, and to detect "self-echo" Realtime events that reflect our own
// write (pull after event returns identical hash → skip hydrate).
const lastHash = new Map();
const KEY_SEP = "\x1f";           // unit separator; safe in item unique_names

// Bootstrap gate: usePersist waits for this before its first cloud push.
// App.jsx's bootstrap flips it once pull+hydrate+markOnly completes (or
// after migration push for fresh accounts). Pushes before bootstrap would
// upload stale localStorage state and then be echoed back as Realtime
// events, causing the pull/push ping-pong users observed.
let bootstrapResolve;
const bootstrapReady = new Promise((r) => { bootstrapResolve = r; });
export function markBootstrapReady() { bootstrapResolve(); }
export function waitForBootstrap() { return bootstrapReady; }

function sortRowsDeterministic(rows, keyCols) {
  return [...rows].sort((a, b) => {
    for (const c of keyCols) {
      const d = String(a[c] ?? "").localeCompare(String(b[c] ?? ""));
      if (d) return d;
    }
    return 0;
  });
}

function compositeKey(row, cols) {
  return cols.map((c) => String(row[c] ?? "")).join(KEY_SEP);
}

async function requireUserId() {
  if (!SUPABASE_ENABLED) return null;
  const session = await ensureSession();
  return session?.user?.id || null;
}

async function syncTable({ table, rows, keyCols, markOnly = false }) {
  const userId = await requireUserId();
  if (!userId) return { ok: false, reason: "no-session" };

  // Hash of the current row set (order-independent via deterministic sort).
  // Skip the network entirely when unchanged since last push.
  const hash = JSON.stringify(sortRowsDeterministic(rows, keyCols));
  if (lastHash.get(table) === hash) return { ok: true, skipped: true };

  // markOnly: record hash+keys without writing — used to "pre-warm" the cache
  // after a pull, so the next persist cycle doesn't echo the same data back.
  if (markOnly) {
    lastHash.set(table, hash);
    lastKeys.set(table, new Set(rows.map((r) => compositeKey(r, keyCols))));
    return { ok: true, skipped: true };
  }

  const current = new Set(rows.map((r) => compositeKey(r, keyCols)));
  const prev = lastKeys.get(table) || new Set();
  const toDelete = [...prev].filter((k) => !current.has(k));

  if (rows.length > 0) {
    const withUser = rows.map((r) => ({ user_id: userId, ...r }));
    const onConflict = ["user_id", ...keyCols].join(",");
    const { error } = await supabase.from(table).upsert(withUser, { onConflict });
    if (error) console.warn(`[sync:${table}] upsert:`, error.message);
  }

  for (const k of toDelete) {
    const parts = k.split(KEY_SEP);
    const filter = { user_id: userId };
    keyCols.forEach((c, i) => { filter[c] = parts[i]; });
    const { error } = await supabase.from(table).delete().match(filter);
    if (error) console.warn(`[sync:${table}] delete:`, error.message);
  }

  lastKeys.set(table, current);
  lastHash.set(table, hash);
  return { ok: true };
}

async function pullTable(table, keyCols) {
  const userId = await requireUserId();
  if (!userId) return { ok: false, rows: [] };

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("user_id", userId);
  if (error) {
    console.warn(`[sync:${table}] pull:`, error.message);
    return { ok: false, rows: [] };
  }
  const rows = data || [];
  lastKeys.set(table, new Set(rows.map((r) => compositeKey(r, keyCols))));
  // Note: lastHash is set by the per-store pull function after it reshapes
  // rows into push-input shape, so hashes match what push would produce.
  return { ok: true, rows };
}

// ============================================================================
// Per-store push/pull
// ============================================================================

// ----- user_profiles -----
export async function pushProfile(profile, { markOnly = false } = {}) {
  const userId = await requireUserId();
  if (!userId) return { ok: false };
  const rowData = {
    language: profile.language ?? null,
    theme_name: profile.themeName ?? null,
    custom_theme_tokens: profile.customThemeTokens ?? null,
    theme_profiles: profile.themeProfiles ?? null,
    completion_view: profile.completionView ?? null,
    onboarding_done: !!profile.onboardingDone,
    stored_version: profile.storedVersion ?? null,
  };
  const hash = JSON.stringify(rowData);
  if (lastHash.get("user_profiles") === hash) return { ok: true, skipped: true };
  if (markOnly) {
    lastHash.set("user_profiles", hash);
    return { ok: true, skipped: true };
  }
  const { error } = await supabase.from("user_profiles")
    .upsert({ user_id: userId, ...rowData }, { onConflict: "user_id" });
  if (error) console.warn("[sync:user_profiles] upsert:", error.message);
  lastHash.set("user_profiles", hash);
  return { ok: !error };
}

export async function pullProfile() {
  const userId = await requireUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[sync:user_profiles] pull:", error.message);
    return null;
  }
  return data || null;
}

// ----- craft_items -----
export async function pushCraftItems(selectedItems, opts = {}) {
  const rows = (selectedItems || []).map((it) => ({
    unique_name: it.uniqueName,
    name: it.name,
    image_url: it.imageUrl || null,
    type: it.type || null,
    category: it.category || null,
    quantity: Number.isFinite(it.quantity) ? it.quantity : 1,
  }));
  return syncTable({ table: "craft_items", rows, keyCols: ["unique_name"], ...opts });
}

export async function pullCraftItems() {
  const { rows } = await pullTable("craft_items", ["unique_name"]);
  return rows.map((r) => ({
    uniqueName: r.unique_name,
    name: r.name,
    imageUrl: r.image_url,
    type: r.type,
    category: r.category,
    quantity: r.quantity ?? 1,
    addedAt: r.added_at ? new Date(r.added_at).getTime() : Date.now(),
  }));
}

// ----- craft_completed (nested map → flat rows) -----
export async function pushCraftCompleted(completedMap, opts = {}) {
  const rows = [];
  for (const [item, reqs] of Object.entries(completedMap || {})) {
    for (const [req, qty] of Object.entries(reqs || {})) {
      const q = Number(qty) || 0;
      if (q > 0) rows.push({ item_unique_name: item, req_unique_name: req, quantity: q });
    }
  }
  return syncTable({
    table: "craft_completed", rows,
    keyCols: ["item_unique_name", "req_unique_name"], ...opts,
  });
}

export async function pullCraftCompleted() {
  const { rows } = await pullTable(
    "craft_completed", ["item_unique_name", "req_unique_name"]
  );
  const out = {};
  for (const r of rows) {
    if (!out[r.item_unique_name]) out[r.item_unique_name] = {};
    out[r.item_unique_name][r.req_unique_name] = r.quantity ?? 0;
  }
  return out;
}

// ----- relic_found_components (nested map → flat rows) -----
export async function pushRelicFound(foundComponents, opts = {}) {
  const rows = [];
  for (const [prime, comps] of Object.entries(foundComponents || {})) {
    for (const [comp, isFound] of Object.entries(comps || {})) {
      if (isFound) {
        rows.push({ prime_unique_name: prime, component_name: comp, is_found: true });
      }
    }
  }
  return syncTable({
    table: "relic_found_components", rows,
    keyCols: ["prime_unique_name", "component_name"], ...opts,
  });
}

export async function pullRelicFound() {
  const { rows } = await pullTable(
    "relic_found_components", ["prime_unique_name", "component_name"]
  );
  const out = {};
  for (const r of rows) {
    if (!r.is_found) continue;
    if (!out[r.prime_unique_name]) out[r.prime_unique_name] = {};
    out[r.prime_unique_name][r.component_name] = true;
  }
  return out;
}

// ----- inventory_parts -----
export async function pushInventoryParts(parts, opts = {}) {
  const rows = Object.values(parts || {})
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

export async function pullInventoryParts() {
  const { rows } = await pullTable("inventory_parts", ["unique_name"]);
  const out = {};
  for (const r of rows) {
    out[r.unique_name] = {
      uniqueName: r.unique_name,
      name: r.name,
      parentUniqueName: r.parent_unique_name,
      parentName: r.parent_name,
      parentImageUrl: r.parent_image_url,
      parentCategory: r.parent_category,
      quantity: r.quantity ?? 0,
    };
  }
  return out;
}

// ----- mastered_items -----
export async function pushMasteredItems(items, opts = {}) {
  const rows = Object.entries(items || {})
    .filter(([, status]) => status === "owned" || status === "mastered")
    .map(([uniqueName, status]) => ({ unique_name: uniqueName, status }));
  return syncTable({ table: "mastered_items", rows, keyCols: ["unique_name"], ...opts });
}

export async function pullMasteredItems() {
  const { rows } = await pullTable("mastered_items", ["unique_name"]);
  const out = {};
  for (const r of rows) out[r.unique_name] = r.status;
  return out;
}

// ----- tracked_amp_sets -----
export async function pushAmpSets(sets, opts = {}) {
  const rows = (sets || []).map((s) => ({
    set_id: String(s.id),
    code: s.code || null,
    prism: s.prism || null,
    scaffold: s.scaffold || null,
    brace: s.brace || null,
  }));
  return syncTable({ table: "tracked_amp_sets", rows, keyCols: ["set_id"], ...opts });
}

export async function pullAmpSets() {
  const { rows } = await pullTable("tracked_amp_sets", ["set_id"]);
  return rows.map((r) => ({
    id: r.set_id,
    code: r.code,
    prism: r.prism,
    scaffold: r.scaffold,
    brace: r.brace,
    createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
  }));
}

// ----- amp_mastery_parts -----
export async function pushAmpMasteryParts(parts, opts = {}) {
  const rows = Object.entries(parts || {})
    .filter(([, status]) => status === "owned" || status === "gilded")
    .map(([uniqueName, status]) => ({ unique_name: uniqueName, status }));
  return syncTable({ table: "amp_mastery_parts", rows, keyCols: ["unique_name"], ...opts });
}

export async function pullAmpMasteryParts() {
  const { rows } = await pullTable("amp_mastery_parts", ["unique_name"]);
  const out = {};
  for (const r of rows) out[r.unique_name] = r.status;
  return out;
}

// ----- amp_completed_materials -----
export async function pushAmpMaterials(materials, opts = {}) {
  const rows = Object.entries(materials || {})
    .filter(([, val]) => !!val)
    .map(([uniqueName]) => ({ unique_name: uniqueName }));
  return syncTable({ table: "amp_completed_materials", rows, keyCols: ["unique_name"], ...opts });
}

export async function pullAmpMaterials() {
  const { rows } = await pullTable("amp_completed_materials", ["unique_name"]);
  const out = {};
  for (const r of rows) out[r.unique_name] = true;
  return out;
}

// ----- checklist_items -----
export async function pushChecklist(items, opts = {}) {
  const rows = (items || []).map((i) => ({
    item_id: String(i.id),
    text: i.text || "",
    type: i.type === "weekly" ? "weekly" : "daily",
    done_for_period: i.doneForPeriod || null,
    is_preset: !!i.isPreset,
  }));
  return syncTable({ table: "checklist_items", rows, keyCols: ["item_id"], ...opts });
}

export async function pullChecklist() {
  const { rows } = await pullTable("checklist_items", ["item_id"]);
  return rows.map((r) => ({
    id: r.item_id,
    text: r.text,
    type: r.type,
    doneForPeriod: r.done_for_period,
    isPreset: !!r.is_preset,
  }));
}

// ----- farm_resources -----
export async function pushFarmResources(resources, opts = {}) {
  const rows = (resources || []).map((r) => ({
    unique_name: r.uniqueName,
    name: r.name,
    image_url: r.imageUrl || null,
    image_url_fallback: r.imageUrlFallback || null,
    target: Math.max(1, Number(r.target) || 1),
  }));
  return syncTable({ table: "farm_resources", rows, keyCols: ["unique_name"], ...opts });
}

export async function pullFarmResources() {
  const { rows } = await pullTable("farm_resources", ["unique_name"]);
  return rows.map((r) => ({
    uniqueName: r.unique_name,
    name: r.name,
    imageUrl: r.image_url,
    imageUrlFallback: r.image_url_fallback,
    target: r.target ?? 1,
  }));
}

// ============================================================================
// Aggregate helpers — used on bootstrap / migration / full refresh.
// ============================================================================

export async function pullAllState() {
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
    profile || craftItems.length > 0 ||
    Object.keys(craftCompleted).length > 0 || Object.keys(relicFound).length > 0 ||
    Object.keys(inventoryParts).length > 0 || Object.keys(masteredItems).length > 0 ||
    ampSets.length > 0 || Object.keys(ampMasteryParts).length > 0 ||
    Object.keys(ampMaterials).length > 0 || checklist.length > 0 || farm.length > 0;
  if (!cloudHasData) return { empty: true };

  // Reassemble into the same shape the persist/normalize layer already uses.
  return {
    empty: false,
    state: {
      language: profile?.language,
      theme: profile?.theme_name,
      customThemeTokens: profile?.custom_theme_tokens,
      themeProfiles: profile?.theme_profiles,
      completionView: profile?.completion_view,
      onboardingDone: !!profile?.onboarding_done,
      storedVersion: profile?.stored_version || null,
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
    },
  };
}

export async function pushAllState(payload, opts = {}) {
  if (!SUPABASE_ENABLED) return { ok: false };
  await Promise.all([
    pushProfile({
      language: payload.language,
      themeName: payload.theme,
      customThemeTokens: payload.customThemeTokens,
      themeProfiles: payload.themeProfiles,
      completionView: payload.completionView,
      onboardingDone: payload.onboardingDone,
      storedVersion: payload.storedVersion,
    }, opts),
    pushCraftItems(payload.selectedItems, opts),
    pushCraftCompleted(payload.completedMap, opts),
    pushRelicFound(payload.relicFoundComponents, opts),
    pushInventoryParts(payload.inventoryParts, opts),
    pushMasteredItems(payload.masteredItems, opts),
    pushAmpSets(payload.trackedSets, opts),
    pushAmpMasteryParts(payload.masteryParts, opts),
    pushAmpMaterials(payload.completedMaterials, opts),
    pushChecklist(payload.checklistItems, opts),
    pushFarmResources(payload.farmResources, opts),
  ]);
  return { ok: true };
}

// ============================================================================
// Per-table Realtime subscription with partial hydration. Replaces the old
// "any change → pullAll" pattern: each table has its own pull+hydrate that
// updates ONLY the matching store slice. Self-echo events are filtered at
// pull time via lastHash (push result is pre-cached with markOnly).
// ============================================================================

const tableTimers = new Map();  // table -> pending setTimeout handle

function debouncedPull(table, handler, delay = 200) {
  if (tableTimers.get(table)) return;
  tableTimers.set(table, setTimeout(async () => {
    tableTimers.delete(table);
    try { await handler(); } catch (e) { console.warn(`[sync:${table}] hydrate:`, e?.message || e); }
  }, delay));
}

// Per-table: pull fresh rows, compare hash, hydrate only matching store slice.
// If hash matches last push, skip hydrate (self-echo).
const perTableHydrators = {
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
    };
    const hash = JSON.stringify(rowData);
    if (lastHash.get("user_profiles") === hash) return;
    lastHash.set("user_profiles", hash);
    useAppStore.setState({
      language: p.language || useAppStore.getState().language,
      themeName: p.theme_name || useAppStore.getState().themeName,
      customThemeTokens: p.custom_theme_tokens || useAppStore.getState().customThemeTokens,
      themeProfiles: p.theme_profiles || {},
      storedVersion: p.stored_version || null,
    });
    useCraftStore.setState({ completionView: p.completion_view || "all" });
  },
  craft_items: async () => {
    const items = await pullCraftItems();
    await pushCraftItems(items, { markOnly: true });  // pre-warm hash → next push skips
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
    await pushAmpSets(sets, { markOnly: true });
    useAmpStore.setState({ trackedSets: sets });
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
    useFarmStore.setState({ trackedResources: resources });
  },
};

export async function subscribeWithHydrate() {
  if (!SUPABASE_ENABLED) return () => {};
  const userId = await requireUserId();
  if (!userId) return () => {};

  const channel = supabase.channel(`wit-sync:${userId}`);
  for (const [table, handler] of Object.entries(perTableHydrators)) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table, filter: `user_id=eq.${userId}` },
      () => debouncedPull(table, handler)
    );
  }
  channel.subscribe();

  return () => {
    for (const t of tableTimers.values()) clearTimeout(t);
    tableTimers.clear();
    supabase.removeChannel(channel);
  };
}
