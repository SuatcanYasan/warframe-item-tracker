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
import { useJunctionStore } from "../stores/junctionStore";
import { useIntrinsicStore } from "../stores/intrinsicStore";
import { useStarChartStore } from "../stores/starChartStore";
import { savePersistedState, normalizePersistedState } from "../utils/storage";
import { broadcastTabSync, onTabSync } from "../utils/tabSync";
import { pushAllState, subscribeWithHydrate, waitForBootstrap } from "../lib/supabaseSync";
import type { PersistedState } from "../types";

export function usePersist(): void {
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
  const masteryRealMR = useMasteryStore((s) => s.realMR);
  const masteryRealTotalXp = useMasteryStore((s) => s.realTotalXp);
  const masteryRealBreakdown = useMasteryStore((s) => s.realBreakdown);
  const masteryLastImportAt = useMasteryStore((s) => s.lastImportAt);
  const masteryRealDisplayName = useMasteryStore((s) => s.realDisplayName);
  const masteryMode = useMasteryStore((s) => s.mode);
  const masterySyncPlayerId = useMasteryStore((s) => s.syncPlayerId);

  const trackedSets = useAmpStore((s) => s.trackedSets);
  const ampMasteryParts = useAmpStore((s) => s.masteryParts);
  const completedMaterials = useAmpStore((s) => s.completedMaterials);
  const checklistItems = useChecklistStore((s) => s.items);
  const farmResources = useFarmStore((s) => s.trackedResources);
  const incarnonClaimed = useIncarnonStore((s) => s.claimed);
  const wfRotationClaimed = useWfRotationStore((s) => s.claimed);
  const arcaneCounts = useArcaneStore((s) => s.arcaneCounts);
  const junctionsCompleted = useJunctionStore((s) => s.completed);
  const intrinsicRanks = useIntrinsicStore((s) => s.ranks);
  const starChartCompleted = useStarChartStore((s) => s.completed);

  // Debounce localStorage writes
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressSaveRef = useRef(false);

  const hydrateAll = (incoming: unknown) => {
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
    useJunctionStore.getState().hydrate(normalized);
    useIntrinsicStore.getState().hydrate(normalized);
    useStarChartStore.getState().hydrate(normalized);
  };

  useEffect(() => onTabSync(hydrateAll), []);

  useEffect(() => {
    let cleanup: () => void = () => {};
    let cancelled = false;
    subscribeWithHydrate().then((fn) => {
      if (cancelled) fn();
      else cleanup = fn;
    });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (suppressSaveRef.current) {
      suppressSaveRef.current = false;
      return;
    }
    const payload: PersistedState = {
      language,
      theme: themeName,
      customThemeTokens,
      themeProfiles,
      completionView,
      selectedItems,
      completedMap,
      onboardingDone: !wizardOpen,
      relicWatchedPrimes: [],
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
      masteryRealMR,
      masteryRealTotalXp,
      masteryRealBreakdown,
      masteryLastImportAt,
      masteryRealDisplayName,
      masteryMode,
      masterySyncPlayerId,
      junctionsCompleted,
      intrinsicRanks,
      starChartCompleted,
      storedVersion,
    };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      savePersistedState(payload);
      broadcastTabSync(payload);
      await waitForBootstrap();
      pushAllState(payload);
      timerRef.current = null;
    }, 300);
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
    masteryRealMR,
    masteryRealTotalXp,
    masteryRealBreakdown,
    masteryLastImportAt,
    masteryRealDisplayName,
    masteryMode,
    masterySyncPlayerId,
    junctionsCompleted,
    intrinsicRanks,
    starChartCompleted,
    storedVersion,
  ]);
}
