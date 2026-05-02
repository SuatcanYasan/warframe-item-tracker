import { useEffect, useRef } from "react";
import { useAppStore } from "../stores/appStore";
import { useCraftStore } from "../stores/craftStore";
import { useRelicStore } from "../stores/relicStore";
import { useInventoryStore } from "../stores/inventoryStore";
import { useMasteryStore } from "../stores/masteryStore";
import { useAmpStore } from "../stores/ampStore";
import { useChecklistStore } from "../stores/checklistStore";
import { useFarmStore } from "../stores/farmStore";
import { useIncarnonStore } from "../stores/incarnonStore";
import { useWfRotationStore } from "../stores/wfRotationStore";
import { useArcaneStore } from "../stores/arcaneStore";
import { savePersistedState, normalizePersistedState } from "../utils/storage";
import { broadcastTabSync, onTabSync } from "../utils/tabSync";
import { pushAllState, subscribeWithHydrate, waitForBootstrap } from "../lib/supabaseSync";

export function usePersist() {
  const language = useAppStore((s) => s.language);
  const themeName = useAppStore((s) => s.themeName);
  const customThemeTokens = useAppStore((s) => s.customThemeTokens);
  const themeProfiles = useAppStore((s) => s.themeProfiles);
  const wizardOpen = useAppStore((s) => s.wizardOpen);
  const storedVersion = useAppStore((s) => s.storedVersion);

  const selectedItems = useCraftStore((s) => s.selectedItems);
  const completedMap = useCraftStore((s) => s.completedMap);
  const completionView = useCraftStore((s) => s.completionView);

  const foundComponents = useRelicStore((s) => s.foundComponents);

  const inventoryParts = useInventoryStore((s) => s.inventoryParts);

  const masteredItems = useMasteryStore((s) => s.masteredItems);

  const trackedSets = useAmpStore((s) => s.trackedSets);
  const ampMasteryParts = useAmpStore((s) => s.masteryParts);
  const completedMaterials = useAmpStore((s) => s.completedMaterials);
  const checklistItems = useChecklistStore((s) => s.items);
  const farmResources = useFarmStore((s) => s.trackedResources);
  const incarnonClaimed = useIncarnonStore((s) => s.claimed);
  const wfRotationClaimed = useWfRotationStore((s) => s.claimed);
  const arcaneCounts = useArcaneStore((s) => s.arcaneCounts);

  // Debounce localStorage writes: batch rapid edits (e.g. typing in theme editor,
  // dragging sliders) into a single JSON.stringify + setItem every 300ms. Flush
  // on unmount so nothing is lost when the tab closes.
  const timerRef = useRef(null);
  // Set by the BroadcastChannel listener when another tab's state is applied —
  // the next save cycle skips write+broadcast to avoid ping-pong loop.
  const suppressSaveRef = useRef(false);

  const hydrateAll = (incoming) => {
    suppressSaveRef.current = true;
    const normalized = normalizePersistedState(incoming);
    useAppStore.getState().hydrate(normalized);
    useCraftStore.getState().hydrate(normalized);
    useRelicStore.getState().hydrate(normalized);
    useInventoryStore.getState().hydrate(normalized);
    useMasteryStore.getState().hydrate(normalized);
    useAmpStore.getState().hydrate(normalized);
    useChecklistStore.getState().hydrate(normalized);
    useFarmStore.getState().hydrate(normalized);
    useIncarnonStore.getState().hydrate(normalized);
    useWfRotationStore.getState().hydrate(normalized);
    useArcaneStore.getState().hydrate(normalized);
  };

  // Cross-tab sync (same browser)
  useEffect(() => onTabSync(hydrateAll), []);

  // Cross-device sync: each table has its own Realtime handler that pulls
  // only that table and hydrates only the matching store slice. Self-echo
  // (Realtime event reflecting our own write) is filtered via hash compare
  // inside supabaseSync.
  useEffect(() => {
    let cleanup = () => {};
    let cancelled = false;
    subscribeWithHydrate().then((fn) => {
      if (cancelled) fn();
      else cleanup = fn;
    });
    return () => { cancelled = true; cleanup(); };
  }, []);

  useEffect(() => {
    if (suppressSaveRef.current) {
      suppressSaveRef.current = false;
      return;
    }
    const payload = {
      language,
      theme: themeName,
      customThemeTokens,
      themeProfiles,
      completionView,
      selectedItems,
      completedMap,
      onboardingDone: !wizardOpen,
      relicFoundComponents: foundComponents,
      inventoryParts,
      masteredItems,
      trackedSets,
      masteryParts: ampMasteryParts,
      completedMaterials,
      checklistItems,
      farmResources,
      incarnonClaimed,
      wfRotationClaimed,
      arcaneCounts,
      storedVersion,
    };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      savePersistedState(payload);
      broadcastTabSync(payload);
      // Wait for the cloud bootstrap (pull+hydrate+markOnly or migration
      // push) before issuing any cloud writes. Prevents the first debounced
      // save from racing the initial pull and pushing stale localStorage
      // state to Supabase.
      await waitForBootstrap();
      pushAllState(payload);
      timerRef.current = null;
    }, 300);
    // Cleanup just cancels the pending timer — DO NOT flush with this
    // payload on deps-change, because a fresh useEffect will re-schedule
    // with the latest state. Flushing here would push stale data right
    // after cloud hydration and cause echo writes. Unmount loss is
    // tolerable: localStorage holds the last debounced snapshot already.
  }, [
    language,
    themeName,
    customThemeTokens,
    themeProfiles,
    completionView,
    selectedItems,
    completedMap,
    wizardOpen,
    foundComponents,
    inventoryParts,
    masteredItems,
    trackedSets,
    ampMasteryParts,
    completedMaterials,
    checklistItems,
    farmResources,
    incarnonClaimed,
    wfRotationClaimed,
    arcaneCounts,
    storedVersion,
  ]);
}
