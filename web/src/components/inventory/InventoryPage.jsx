import { useState, useMemo, useCallback } from "react";
import { Button, Modal } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useQueries } from "@tanstack/react-query";
import { requestJson } from "../../utils/helpers";
import { useFuzzySearch } from "../../hooks/useFuzzySearch";
import PartsTab from "./tabs/PartsTab";
import SetsTab from "./tabs/SetsTab";
import InventorySearchDrawer from "./InventorySearchDrawer";
import { useTranslate } from "../../hooks/useTranslate";
import { useInventoryStore } from "../../stores/inventoryStore";

export default function InventoryTrackerContent() {
  const { t, tin } = useTranslate();
  const inventoryParts = useInventoryStore((s) => s.inventoryParts);
  const setInventoryParts = useInventoryStore((s) => s.setInventoryParts);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("parts");
  const [search, setSearch] = useState("");

  const { message } = Modal.useModal ? {} : {};

  // Add part
  const addPart = useCallback((comp, quantity) => {
    setInventoryParts((prev) => ({
      ...prev,
      [comp.uniqueName]: {
        uniqueName: comp.uniqueName,
        name: comp.name,
        parentUniqueName: comp.parentUniqueName,
        parentName: comp.parentName,
        parentImageUrl: comp.parentImageUrl,
        parentCategory: comp.parentCategory,
        quantity: (prev[comp.uniqueName]?.quantity || 0) + quantity,
      },
    }));
  }, [setInventoryParts]);

  // Update quantity
  const updateQty = useCallback((uniqueName, qty) => {
    if (qty <= 0) {
      setInventoryParts((prev) => {
        const next = { ...prev };
        delete next[uniqueName];
        return next;
      });
    } else {
      setInventoryParts((prev) => ({
        ...prev,
        [uniqueName]: { ...prev[uniqueName], quantity: qty },
      }));
    }
  }, [setInventoryParts]);

  // Remove part
  const removePart = useCallback((uniqueName) => {
    setInventoryParts((prev) => {
      const next = { ...prev };
      delete next[uniqueName];
      return next;
    });
  }, [setInventoryParts]);

  // Parts list sorted by name
  const sortedParts = useMemo(() => {
    const list = Object.values(inventoryParts);
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [inventoryParts]);

  const partsList = useFuzzySearch(sortedParts, ["name", "parentName"], search);

  // Build sets from inventory parts
  // Group by parentUniqueName, then fetch full component list from API to know total components
  const parentUniqueNames = useMemo(() => {
    const names = new Set();
    for (const part of Object.values(inventoryParts)) {
      names.add(part.parentUniqueName);
    }
    return Array.from(names);
  }, [inventoryParts]);

  // Fetch parent item component lists for sets tab using React Query
  const parentDropQueries = useQueries({
    queries: parentUniqueNames.map((un) => ({
      queryKey: ['itemDrops', un],
      queryFn: () => requestJson(`/api/items/drops/${encodeURIComponent(un)}`),
      staleTime: 5 * 60 * 1000,
      retry: 1,
    })),
  });

  // Build parentComponentsCache from query results
  const parentComponentsCache = useMemo(() => {
    const cache = {};
    parentUniqueNames.forEach((un, i) => {
      const query = parentDropQueries[i];
      if (query.data) {
        cache[un] = (query.data.componentDrops || []).map((cd) => cd.componentName);
      }
    });
    return cache;
  }, [parentUniqueNames, parentDropQueries]);

  // Build sets data
  const sets = useMemo(() => {
    const grouped = {};
    for (const part of Object.values(inventoryParts)) {
      if (!grouped[part.parentUniqueName]) {
        grouped[part.parentUniqueName] = {
          parentUniqueName: part.parentUniqueName,
          parentName: part.parentName,
          parentCategory: part.parentCategory,
          imageUrl: part.parentImageUrl,
          ownedComponents: {},
        };
      }
      grouped[part.parentUniqueName].ownedComponents[part.name] = part.quantity;
    }

    return Object.values(grouped).map((group) => {
      const cachedComponents = parentComponentsCache[group.parentUniqueName];
      const componentNames = cachedComponents || Object.keys(group.ownedComponents);

      return {
        ...group,
        components: componentNames.map((name) => ({
          uniqueName: name,
          name,
          owned: group.ownedComponents[name] || 0,
        })),
      };
    }).sort((a, b) => {
      // Complete sets first
      const aComplete = a.components.every((c) => c.owned > 0);
      const bComplete = b.components.every((c) => c.owned > 0);
      if (aComplete !== bComplete) return aComplete ? -1 : 1;
      return a.parentName.localeCompare(b.parentName);
    });
  }, [inventoryParts, parentComponentsCache]);

  const filteredSets = useFuzzySearch(sets, ["parentName"], search);

  return (
    <>
      <div className="content-header">
        <div className="content-tabs">
          <button
            className={`content-tab ${activeTab === "parts" ? "active" : ""}`}
            onClick={() => setActiveTab("parts")}
          >
            {t("partsTab")} <span className="content-tab-badge">{Object.keys(inventoryParts).length}</span>
          </button>
          <button
            className={`content-tab ${activeTab === "sets" ? "active" : ""}`}
            onClick={() => setActiveTab("sets")}
          >
            {t("setsTab")} <span className="content-tab-badge">{parentUniqueNames.length}</span>
          </button>
        </div>
        <div className="content-actions">
          <Button size="small" type="default" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
            {t("addPart")}
          </Button>
        </div>
      </div>

      <div className="craft-toolbar">
        <div className="craft-toolbar-left">
          <div className="craft-search-compact">
            <SearchOutlined className="craft-search-compact-icon" />
            <input
              className="craft-search-compact-input"
              placeholder={t("inventorySearch")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="craft-search-clear" onClick={() => setSearch("")}>&times;</button>
            )}
          </div>
        </div>
      </div>

      {activeTab === "parts" && (
        <PartsTab
          partsList={partsList}
          onUpdateQty={updateQty}
          onRemove={removePart}
        />
      )}

      {activeTab === "sets" && (
        <SetsTab
          sets={filteredSets}
        />
      )}

      <InventorySearchDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAddPart={addPart}
        existingParts={inventoryParts}
      />
    </>
  );
}
