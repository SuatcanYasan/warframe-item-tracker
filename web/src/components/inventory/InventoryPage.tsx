import { useState, useMemo, useCallback } from "react";
import { Button } from "antd";
import { PlusOutlined, SearchOutlined, CheckSquareOutlined, CloseOutlined, DeleteOutlined } from "@ant-design/icons";
import { App as AntApp } from "antd";
import { useQueries } from "@tanstack/react-query";
import { requestJson } from "../../utils/helpers";
import { useFuzzySearch } from "../../hooks/useFuzzySearch";
import PartsTab from "./tabs/PartsTab";
import SetsTab from "./tabs/SetsTab";
import InventorySearchDrawer from "./InventorySearchDrawer";
import { useTranslate } from "../../hooks/useTranslate";
import { useInventoryStore } from "../../stores/inventoryStore";
import type { InventoryPart } from "../../types";

interface ComponentInput {
  uniqueName: string;
  name: string;
  parentUniqueName: string;
  parentName: string;
  parentImageUrl: string | null;
  parentCategory?: string | null;
}

interface SetGroup {
  parentUniqueName: string;
  parentName: string;
  parentCategory?: string | null;
  imageUrl: string | null;
  ownedComponents: Record<string, number>;
}

export default function InventoryTrackerContent() {
  const { t } = useTranslate();
  const { modal } = AntApp.useApp();
  const inventoryParts = useInventoryStore((s) => s.inventoryParts);
  const setInventoryParts = useInventoryStore((s) => s.setInventoryParts);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"parts" | "sets">("parts");
  const [search, setSearch] = useState<string>("");
  const [multiMode, setMultiMode] = useState<boolean>(false);
  const [multiIds, setMultiIds] = useState<Set<string>>(new Set<string>());

  // Add part
  const addPart = useCallback((comp: ComponentInput, quantity: number) => {
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
  const updateQty = useCallback((uniqueName: string, qty: number) => {
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
  const removePart = useCallback((uniqueName: string) => {
    setInventoryParts((prev) => {
      const next = { ...prev };
      delete next[uniqueName];
      return next;
    });
  }, [setInventoryParts]);

  const toggleMultiId = useCallback((id: string) => {
    setMultiIds((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }, []);

  const removeMultiSelected = useCallback(() => {
    setInventoryParts((prev) => {
      const next = { ...prev };
      multiIds.forEach((id) => delete next[id]);
      return next;
    });
    setMultiIds(new Set());
    setMultiMode(false);
  }, [multiIds, setInventoryParts]);

  // Parts list sorted by name
  const sortedParts = useMemo<InventoryPart[]>(() => {
    const list = Object.values(inventoryParts);
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [inventoryParts]);

  const partsList = useFuzzySearch(sortedParts, ["name", "parentName"], search);

  // Build sets from inventory parts
  const parentUniqueNames = useMemo(() => {
    const names = new Set<string>();
    for (const part of Object.values(inventoryParts)) {
      names.add(part.parentUniqueName);
    }
    return Array.from(names);
  }, [inventoryParts]);

  const parentDropQueries = useQueries({
    queries: parentUniqueNames.map((un) => ({
      queryKey: ['itemDrops', un],
      queryFn: () => requestJson(`/api/items/drops/${encodeURIComponent(un)}`),
      enabled: activeTab === "sets",
      staleTime: Infinity,
      gcTime: Infinity,
      retry: 1,
    })),
  });

  // Build parentComponentsCache from query results
  const parentComponentsCache = useMemo<Record<string, string[]>>(() => {
    const cache: Record<string, string[]> = {};
    parentUniqueNames.forEach((un, i) => {
      const query = parentDropQueries[i];
      if (query.data) {
        cache[un] = (((query.data as any).componentDrops || []) as Array<{ componentName: string }>).map((cd) => cd.componentName);
      }
    });
    return cache;
  }, [parentUniqueNames, parentDropQueries]);

  // Build sets data
  const sets = useMemo(() => {
    const grouped: Record<string, SetGroup> = {};
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
          {multiMode ? (
            <>
              <span className="multi-select-count">{multiIds.size} {t("multiSelected")}</span>
              <Button size="small" onClick={() => setMultiIds(new Set(sortedParts.map((p) => p.uniqueName)))}>{t("multiSelectAll")}</Button>
              <Button size="small" danger icon={<DeleteOutlined />} disabled={multiIds.size === 0} onClick={() => {
                modal.confirm({
                  title: t("confirmRemoveTitle"),
                  content: t("multiRemoveContent", { count: multiIds.size }),
                  okText: t("confirmRemoveOk"),
                  cancelText: t("confirmRemoveCancel"),
                  okButtonProps: { danger: true },
                  onOk: removeMultiSelected,
                });
              }}>{t("multiRemove")}</Button>
              <Button size="small" icon={<CloseOutlined />} onClick={() => { setMultiMode(false); setMultiIds(new Set()); }}>{t("multiCancel")}</Button>
            </>
          ) : (
            <>
              {sortedParts.length > 1 && (
                <Button size="small" icon={<CheckSquareOutlined />} onClick={() => setMultiMode(true)}>{t("multiSelect")}</Button>
              )}
              <Button size="small" type="default" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
                {t("addPart")}
              </Button>
            </>
          )}
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
          multiMode={multiMode}
          multiIds={multiIds}
          onToggleMulti={toggleMultiId}
          onOpenAddDrawer={() => setDrawerOpen(true)}
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
