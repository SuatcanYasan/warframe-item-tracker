import { useEffect } from "react";
import { useAppStore } from "../stores/appStore";
import { useCraftStore } from "../stores/craftStore";
import { useRelicStore } from "../stores/relicStore";
import { useInventoryStore } from "../stores/inventoryStore";
import { useMasteryStore } from "../stores/masteryStore";
import { useAmpStore } from "../stores/ampStore";
import { useChecklistStore } from "../stores/checklistStore";
import { useFarmStore } from "../stores/farmStore";
import { savePersistedState } from "../utils/storage";

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
  const discordWebhookUrl = useAppStore((s) => s.discordWebhookUrl);
  const discordWebhookUsername = useAppStore((s) => s.discordWebhookUsername);
  const discordWebhookEvents = useAppStore((s) => s.discordWebhookEvents);
  const farmResources = useFarmStore((s) => s.trackedResources);

  useEffect(() => {
    savePersistedState({
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
      discordWebhookUrl,
      discordWebhookUsername,
      discordWebhookEvents,
      farmResources,
      storedVersion,
    });
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
    discordWebhookUrl,
    discordWebhookUsername,
    discordWebhookEvents,
    farmResources,
    storedVersion,
  ]);
}
