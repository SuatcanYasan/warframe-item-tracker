import { useEffect, useMemo } from "react";
import { useCraftStore } from "../stores/craftStore";
import { useRelicStore } from "../stores/relicStore";
import type { EnrichedRequirement, Requirement } from "../utils/helpers";
import type { SelectedCraftItem } from "../types";

const COMPONENT_ALIASES: Record<string, string> = {
  helmet: "neuroptics",
  neuroptics: "helmet",
};

const STANDARD_COMPONENT_NAMES: readonly string[] = [
  "Blueprint", "Chassis", "Neuroptics", "Systems",
  "Barrel", "Receiver", "Stock", "Blade", "Handle", "Head",
  "Upper Limb", "Lower Limb", "Grip", "String", "Pouch",
  "Link", "Band", "Buckle", "Gauntlet", "Boot",
  "Cerebrum", "Carapace",
];

function matchReqToComponent(reqName: string, componentName: string): boolean {
  const rn = (reqName || "").toLowerCase();
  const cn = (componentName || "").toLowerCase();
  if (rn.includes(cn) || cn.includes(rn)) return true;
  const alias = COMPONENT_ALIASES[cn];
  if (alias && rn.includes(alias)) return true;
  const matchKey = Object.keys(COMPONENT_ALIASES).find((k) => rn.includes(k));
  const reverseAlias = matchKey ? COMPONENT_ALIASES[matchKey] : undefined;
  if (reverseAlias && reverseAlias === cn) return true;
  return false;
}

export interface RelicSyncBag {
  handleRelicToggleFound: (primeUniqueName: string, componentName: string) => void;
  craftToRelicMap: Map<string, Record<string, string>>;
}

export function useRelicSync(
  watchedPrimes: SelectedCraftItem[],
  detailByItem: Map<string, Requirement[]>,
  enrichedByItemUnfiltered: Map<string, EnrichedRequirement[]>,
): RelicSyncBag {
  const foundComponents = useRelicStore((s) => s.foundComponents);
  const setFoundComponents = useRelicStore((s) => s.setFoundComponents);
  const setCompletedMap = useCraftStore((s) => s.setCompletedMap);

  const craftToRelicMap = useMemo(() => {
    const map = new Map<string, Record<string, string>>();
    for (const item of watchedPrimes) {
      const reqs = detailByItem.get(item.uniqueName) || [];
      const reqMap: Record<string, string> = {};
      for (const req of reqs) {
        const existingKeys = Object.keys(foundComponents[item.uniqueName] || {});
        const fromExisting = existingKeys.find((k) => matchReqToComponent(req.name, k));
        const fromStandard = STANDARD_COMPONENT_NAMES.find((sn) =>
          matchReqToComponent(req.name, sn),
        );
        const relicName = fromExisting || fromStandard;
        if (relicName) reqMap[req.name] = relicName;
      }
      map.set(item.uniqueName, reqMap);
    }
    return map;
  }, [watchedPrimes, detailByItem, foundComponents]);

  useEffect(() => {
    if (watchedPrimes.length === 0) return;

    setFoundComponents((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const item of watchedPrimes) {
        const reqs = enrichedByItemUnfiltered.get(item.uniqueName) || [];
        if (reqs.length === 0) continue;
        if (!next[item.uniqueName]) next[item.uniqueName] = {};

        const reqMap = craftToRelicMap.get(item.uniqueName) || {};
        for (const req of reqs) {
          const relicName = reqMap[req.name];
          if (!relicName) continue;

          const currentFound = !!next[item.uniqueName][relicName];
          if (req.isDone !== currentFound) {
            next[item.uniqueName] = {
              ...next[item.uniqueName],
              [relicName]: req.isDone,
            };
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [enrichedByItemUnfiltered, watchedPrimes, craftToRelicMap, setFoundComponents]);

  const handleRelicToggleFound = (primeUniqueName: string, componentName: string) => {
    const primeMap = { ...(foundComponents[primeUniqueName] || {}) };
    const newFound = !primeMap[componentName];
    primeMap[componentName] = newFound;

    setFoundComponents((prev) => ({
      ...prev,
      [primeUniqueName]: primeMap,
    }));

    const reqs = detailByItem.get(primeUniqueName) || [];
    const matchingReq = reqs.find((r) => matchReqToComponent(r.name, componentName));
    if (matchingReq) {
      setCompletedMap((prevMap) => ({
        ...prevMap,
        [primeUniqueName]: {
          ...(prevMap[primeUniqueName] || {}),
          [matchingReq.uniqueName]: newFound ? matchingReq.quantity : 0,
        },
      }));
    }
  };

  return { handleRelicToggleFound, craftToRelicMap };
}
