import { useEffect, useMemo } from "react";
import { useCraftStore } from "../stores/craftStore";
import { useRelicStore } from "../stores/relicStore";

const COMPONENT_ALIASES = {
  helmet: "neuroptics",
  neuroptics: "helmet",
};

const STANDARD_COMPONENT_NAMES = [
  "Blueprint", "Chassis", "Neuroptics", "Systems",
  "Barrel", "Receiver", "Stock", "Blade", "Handle", "Head",
  "Upper Limb", "Lower Limb", "Grip", "String", "Pouch",
  "Link", "Band", "Buckle", "Gauntlet", "Boot",
  "Cerebrum", "Carapace",
];

function matchReqToComponent(reqName, componentName) {
  const rn = (reqName || "").toLowerCase();
  const cn = (componentName || "").toLowerCase();
  if (rn.includes(cn) || cn.includes(rn)) return true;
  const alias = COMPONENT_ALIASES[cn];
  if (alias && rn.includes(alias)) return true;
  const reverseAlias =
    COMPONENT_ALIASES[
      Object.keys(COMPONENT_ALIASES).find((k) => rn.includes(k))
    ];
  if (reverseAlias && reverseAlias === cn) return true;
  return false;
}

export function useRelicSync(watchedPrimes, detailByItem, enrichedByItemUnfiltered) {
  const foundComponents = useRelicStore((s) => s.foundComponents);
  const setFoundComponents = useRelicStore((s) => s.setFoundComponents);
  const setCompletedMap = useCraftStore((s) => s.setCompletedMap);

  const craftToRelicMap = useMemo(() => {
    const map = new Map();
    for (const item of watchedPrimes) {
      const reqs = detailByItem.get(item.uniqueName) || [];
      const reqMap = {};
      for (const req of reqs) {
        const existingKeys = Object.keys(foundComponents[item.uniqueName] || {});
        const fromExisting = existingKeys.find((k) =>
          matchReqToComponent(req.name, k),
        );
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

  // Craft completion -> relic found sync
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

  // Relic toggle -> craft completion sync
  const handleRelicToggleFound = (primeUniqueName, componentName) => {
    const primeMap = { ...(foundComponents[primeUniqueName] || {}) };
    const newFound = !primeMap[componentName];
    primeMap[componentName] = newFound;

    // Update relic store
    setFoundComponents((prev) => ({
      ...prev,
      [primeUniqueName]: primeMap,
    }));

    // Sync to craft completedMap
    const reqs = detailByItem.get(primeUniqueName) || [];
    const matchingReq = reqs.find((r) =>
      matchReqToComponent(r.name, componentName),
    );
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
