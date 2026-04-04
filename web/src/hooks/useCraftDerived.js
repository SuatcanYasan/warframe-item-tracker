import { useMemo } from "react";
import { useCraftStore } from "../stores/craftStore";
import { enrichRequirements } from "../utils/helpers";

export function useCraftDerived() {
  const selectedItems = useCraftStore((s) => s.selectedItems);
  const completedMap = useCraftStore((s) => s.completedMap);
  const calculation = useCraftStore((s) => s.calculation);
  const completionView = useCraftStore((s) => s.completionView);

  const detailByItem = useMemo(() => {
    const map = new Map();
    for (const item of calculation.perItem || []) {
      map.set(item.uniqueName, item.requirements || []);
    }
    return map;
  }, [calculation.perItem]);

  const enrichedByItem = useMemo(() => {
    const map = new Map();
    for (const item of selectedItems) {
      map.set(
        item.uniqueName,
        enrichRequirements(
          detailByItem.get(item.uniqueName) || [],
          completedMap[item.uniqueName] || {},
          completionView,
        ),
      );
    }
    return map;
  }, [selectedItems, detailByItem, completedMap, completionView]);

  const enrichedByItemUnfiltered = useMemo(() => {
    const map = new Map();
    for (const item of selectedItems) {
      map.set(
        item.uniqueName,
        enrichRequirements(
          detailByItem.get(item.uniqueName) || [],
          completedMap[item.uniqueName] || {},
          "all",
        ),
      );
    }
    return map;
  }, [selectedItems, detailByItem, completedMap]);

  const adjustedTotals = useMemo(() => {
    const deduction = new Map();
    for (const parent of selectedItems) {
      const requirements = detailByItem.get(parent.uniqueName) || [];
      const completed = completedMap[parent.uniqueName] || {};
      for (const requirement of requirements) {
        const completedQuantity = Math.min(
          requirement.quantity,
          Math.max(0, Number(completed[requirement.uniqueName]) || 0),
        );
        if (completedQuantity > 0) {
          deduction.set(
            requirement.uniqueName,
            (deduction.get(requirement.uniqueName) || 0) + completedQuantity,
          );
        }
      }
    }
    return (calculation.totals || []).map((total) => {
      const remaining = Math.max(
        0,
        total.quantity - (deduction.get(total.uniqueName) || 0),
      );
      const completedAmount = total.quantity - remaining;
      const completionPercent =
        total.quantity > 0
          ? Math.round((completedAmount / total.quantity) * 100)
          : 100;
      const status =
        remaining === 0 ? "done" : completionPercent > 0 ? "partial" : "open";
      return { ...total, remaining, completedAmount, completionPercent, status };
    });
  }, [calculation.totals, completedMap, detailByItem, selectedItems]);

  const categoryOptions = useMemo(() => {
    const cats = new Set();
    for (const item of selectedItems) {
      const cat = item.category || item.type || "";
      if (cat) cats.add(cat);
    }
    return ["all", ...Array.from(cats).sort()];
  }, [selectedItems]);

  const watchedPrimes = useMemo(
    () =>
      selectedItems.filter(
        (item) => item.name && item.name.toLowerCase().includes("prime"),
      ),
    [selectedItems],
  );

  return {
    detailByItem,
    enrichedByItem,
    enrichedByItemUnfiltered,
    adjustedTotals,
    categoryOptions,
    watchedPrimes,
  };
}

export function useFilteredSelectedItems(enrichedByItem) {
  const selectedItems = useCraftStore((s) => s.selectedItems);
  const selectedSearch = useCraftStore((s) => s.selectedSearch);
  const selectedFilter = useCraftStore((s) => s.selectedFilter);
  const selectedCategory = useCraftStore((s) => s.selectedCategory);

  return useMemo(() => {
    const query = selectedSearch.trim().toLowerCase();
    return selectedItems.filter((item) => {
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.uniqueName.toLowerCase().includes(query);
      if (!matchesQuery) return false;
      if (selectedCategory !== "all") {
        const cat = (item.category || item.type || "").toLowerCase();
        if (cat !== selectedCategory.toLowerCase()) return false;
      }
      if (selectedFilter === "all") return true;
      const reqs = enrichedByItem.get(item.uniqueName) || [];
      const total = reqs.length;
      const done = reqs.filter((r) => r.isDone).length;
      const allDone = total > 0 && done === total;
      if (selectedFilter === "done") return allDone;
      if (selectedFilter === "open") return !allDone;
      return true;
    });
  }, [
    selectedItems,
    selectedSearch,
    selectedFilter,
    selectedCategory,
    enrichedByItem,
  ]);
}

export function useFilteredTotals(adjustedTotals) {
  const totalsSearch = useCraftStore((s) => s.totalsSearch);
  const totalsFilter = useCraftStore((s) => s.totalsFilter);

  return useMemo(() => {
    const query = totalsSearch.trim().toLowerCase();
    return adjustedTotals.filter((item) => {
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.uniqueName.toLowerCase().includes(query);
      if (!matchesQuery) return false;
      if (totalsFilter === "all") return true;
      if (totalsFilter === "done") return item.status === "done";
      if (totalsFilter === "open") return item.status !== "done";
      return true;
    });
  }, [adjustedTotals, totalsSearch, totalsFilter]);
}
