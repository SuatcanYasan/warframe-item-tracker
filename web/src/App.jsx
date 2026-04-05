import { useEffect, useRef, useState } from "react";
import { App as AntApp, Button, ConfigProvider } from "antd";
import toast from "react-hot-toast";
import {
  PlusOutlined,
  DownloadOutlined,
  UploadOutlined,
  SearchOutlined,
  ClearOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import hotkeys from "hotkeys-js";
import { themeOptions } from "./constants/themes";
import {
  readStorage,
  normalizePersistedState,
} from "./utils/storage";
import { requestJson } from "./utils/helpers";
import { captureAndDownload } from "./utils/screenshot";

import { useAppStore } from "./stores/appStore";
import { useCraftStore } from "./stores/craftStore";
import { useRelicStore } from "./stores/relicStore";
import { useInventoryStore } from "./stores/inventoryStore";

import { useTranslate } from "./hooks/useTranslate";
import {
  useCraftDerived,
  useFilteredSelectedItems,
  useFilteredTotals,
} from "./hooks/useCraftDerived";
import { useRelicSync } from "./hooks/useRelicSync";
import { usePersist } from "./hooks/usePersist";

import Sidebar from "./components/shared/Sidebar";
import AppHeader from "./components/shared/AppHeader";
import SummaryBar from "./components/craft/SummaryBar";
import ItemCardGrid from "./components/craft/ItemCardGrid";
import TotalsCardGrid from "./components/craft/TotalsCardGrid";
import SearchDrawer from "./components/craft/SearchDrawer";
import ThemeDrawer from "./components/shared/ThemeDrawer";
import WizardModal from "./components/shared/WizardModal";
import ShortcutsModal from "./components/shared/ShortcutsModal";
import ItemDetailModal from "./components/craft/modals/ItemDetailModal";
import TotalDetailModal from "./components/craft/modals/TotalDetailModal";
import RelicTrackerContent from "./components/relic/RelicPage";
import InventoryTrackerContent from "./components/inventory/InventoryPage";

function CraftAppContent() {
  const { modal } = AntApp.useApp();
  const { t } = useTranslate();

  // --- Stores ---
  const themeName = useAppStore((s) => s.themeName);
  const customThemeTokens = useAppStore((s) => s.customThemeTokens);
  const openThemeDrawer = useAppStore((s) => s.openThemeDrawer);

  const selectedItems = useCraftStore((s) => s.selectedItems);
  const setSelectedItems = useCraftStore((s) => s.setSelectedItems);
  const setCalculation = useCraftStore((s) => s.setCalculation);
  const setLoadingCalc = useCraftStore((s) => s.setLoadingCalc);
  const activeTab = useCraftStore((s) => s.activeTab);
  const setActiveTab = useCraftStore((s) => s.setActiveTab);
  const detailItem = useCraftStore((s) => s.detailItem);
  const setDetailItem = useCraftStore((s) => s.setDetailItem);
  const detailMaterial = useCraftStore((s) => s.detailMaterial);
  const setDetailMaterial = useCraftStore((s) => s.setDetailMaterial);
  const searchDrawerOpen = useCraftStore((s) => s.searchDrawerOpen);
  const openSearchDrawer = useCraftStore((s) => s.openSearchDrawer);
  const closeSearchDrawer = useCraftStore((s) => s.closeSearchDrawer);
  const selectedSearch = useCraftStore((s) => s.selectedSearch);
  const setSelectedSearch = useCraftStore((s) => s.setSelectedSearch);
  const selectedFilter = useCraftStore((s) => s.selectedFilter);
  const setSelectedFilter = useCraftStore((s) => s.setSelectedFilter);
  const selectedCategory = useCraftStore((s) => s.selectedCategory);
  const setSelectedCategory = useCraftStore((s) => s.setSelectedCategory);
  const totalsSearch = useCraftStore((s) => s.totalsSearch);
  const setTotalsSearch = useCraftStore((s) => s.setTotalsSearch);
  const totalsFilter = useCraftStore((s) => s.totalsFilter);
  const setTotalsFilter = useCraftStore((s) => s.setTotalsFilter);
  const addItem = useCraftStore((s) => s.addItem);
  const removeItem = useCraftStore((s) => s.removeItem);
  const updateQuantity = useCraftStore((s) => s.updateQuantity);
  const setCompletedQuantity = useCraftStore((s) => s.setCompletedQuantity);
  const bulkDonate = useCraftStore((s) => s.bulkDonate);
  const clearAll = useCraftStore((s) => s.clearAll);
  const completedMap = useCraftStore((s) => s.completedMap);
  const loadingCalc = useCraftStore((s) => s.loadingCalc);

  const removeItemFromRelic = useRelicStore((s) => s.clearForItem);

  const importInputRef = useRef(null);

  // --- Derived data ---
  const {
    detailByItem, enrichedByItem, enrichedByItemUnfiltered,
    adjustedTotals, categoryOptions, watchedPrimes,
  } = useCraftDerived();
  const filteredSelectedItems = useFilteredSelectedItems(enrichedByItem);
  const filteredTotals = useFilteredTotals(adjustedTotals);

  // --- Relic sync ---
  const { handleRelicToggleFound } = useRelicSync(
    watchedPrimes, detailByItem, enrichedByItemUnfiltered,
  );

  // --- Persistence ---
  usePersist();

  // --- Sync theme to outer shell ---
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("wf-theme-change", {
      detail: { themeName, tokens: customThemeTokens },
    }));
  }, [themeName, customThemeTokens]);

  // --- Theme CSS vars ---
  useEffect(() => {
    document.body.setAttribute("data-theme", themeName);
    const root = document.documentElement;
    root.style.setProperty("--wf-bg-base", customThemeTokens.colorBgBase || "#0b1220");
    root.style.setProperty("--wf-bg-container", customThemeTokens.colorBgContainer || "#111b34");
    root.style.setProperty("--wf-bg-elevated", customThemeTokens.colorBgElevated || "#152344");
    root.style.setProperty("--wf-text", customThemeTokens.colorText || "#eaf0ff");
    root.style.setProperty("--wf-text-muted", customThemeTokens.colorTextSecondary || "#9db2da");
    root.style.setProperty("--wf-border", customThemeTokens.colorBorder || "#2f4774");
    root.style.setProperty("--wf-scrollbar", customThemeTokens.colorScrollbar || customThemeTokens.colorBorder || "#2f4774");
    root.style.setProperty("--wf-primary", customThemeTokens.colorPrimary || "#CA8A04");
  }, [customThemeTokens, themeName]);

  // --- Calculate ---
  useEffect(() => {
    if (selectedItems.length === 0) {
      setCalculation({ perItem: [], totals: [] });
      return;
    }
    let cancelled = false;
    async function calculate() {
      setLoadingCalc(true);
      try {
        const data = await requestJson("/api/calculate", {
          method: "POST",
          body: JSON.stringify({
            items: selectedItems,
            expandSubcomponents: false,
            includeBlueprints: false,
          }),
        });
        if (!cancelled) {
          setCalculation({ perItem: data.perItem || [], totals: data.totals || [] });
        }
      } catch (error) {
        if (!cancelled) toast.error(error.message);
      } finally {
        if (!cancelled) setLoadingCalc(false);
      }
    }
    calculate();
    return () => { cancelled = true; };
  }, [selectedItems]);

  // --- Metadata resolution ---
  useEffect(() => {
    const missingMetadataNames = selectedItems
      .filter((item) => {
        const cat = String(item.category || "").trim().toLowerCase();
        const typ = String(item.type || "").trim().toLowerCase();
        return (!cat || cat === "bilinmiyor" || cat === "unknown") && (!typ || typ === "bilinmiyor" || typ === "unknown");
      })
      .map((item) => item.uniqueName);
    if (missingMetadataNames.length === 0) return;
    let cancelled = false;
    requestJson("/api/items/resolve-metadata", {
      method: "POST",
      body: JSON.stringify({ uniqueNames: missingMetadataNames }),
    }).then((data) => {
      if (cancelled) return;
      const resolved = data?.itemsByUniqueName || {};
      if (Object.keys(resolved).length === 0) return;
      setSelectedItems((prev) => {
        let changed = false;
        const next = prev.map((item) => {
          const r = resolved[item.uniqueName];
          if (!r) return item;
          const nextType = item.type || r.type || null;
          const nextCategory = item.category || r.category || r.type || null;
          const nextImageUrl = item.imageUrl || r.imageUrl || null;
          if (nextType === item.type && nextCategory === item.category && nextImageUrl === item.imageUrl) return item;
          changed = true;
          return { ...item, type: nextType, category: nextCategory, imageUrl: nextImageUrl };
        });
        return changed ? next : prev;
      });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [selectedItems]);

  // --- Actions needing message/modal ---
  function handleAddItem(item) {
    addItem(item);
    toast.success(`${item.name} +1`);
  }

  function handleRemoveItem(uniqueName) {
    removeItem(uniqueName);
    removeItemFromRelic(uniqueName);
  }

  function removeItemWithConfirm(item) {
    modal.confirm({
      title: t("confirmRemoveTitle"),
      content: t("confirmRemoveContent", { name: item.name }),
      okText: t("confirmRemoveOk"),
      cancelText: t("confirmRemoveCancel"),
      okButtonProps: { danger: true },
      onOk: () => handleRemoveItem(item.uniqueName),
    });
  }

  function confirmClearAll() {
    modal.confirm({
      title: t("confirmClearAllTitle"),
      content: t("confirmClearAllContent"),
      okText: t("confirmRemoveOk"),
      cancelText: t("confirmRemoveCancel"),
      okButtonProps: { danger: true },
      onOk: () => clearAll(),
    });
  }

  function handleBulkDonate(resourceUniqueName, totalAmount) {
    bulkDonate(resourceUniqueName, totalAmount, detailByItem);
    toast.success(t("bulkDonateSuccess", { name: "", amount: totalAmount }));
  }

  function exportData() {
    const payload = { exportedAt: new Date().toISOString(), selectedItems, completedMap };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wf-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("exportSuccess"));
  }

  function importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        if (!Array.isArray(parsed.selectedItems)) throw new Error("invalid");
        setSelectedItems(parsed.selectedItems);
        if (parsed.completedMap && typeof parsed.completedMap === "object") {
          useCraftStore.getState().setCompletedMap(parsed.completedMap);
        }
        toast.success(t("importSuccess"));
      } catch {
        toast.error(t("importError"));
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  // --- Document title ---
  const location = useLocation();
  const navigate = useNavigate();

  // --- Keyboard shortcuts (hotkeys-js) ---
  useEffect(() => {
    hotkeys.filter = (event) => {
      const target = event.target || event.srcElement;
      const tagName = target?.tagName;
      return !["INPUT", "TEXTAREA", "SELECT"].includes(tagName);
    };

    hotkeys("/", (e) => {
      e.preventDefault();
      useCraftStore.getState().openSearchDrawer();
    });
    hotkeys("ctrl+k,cmd+k", (e) => {
      e.preventDefault();
      useAppStore.getState().openShortcuts();
    });
    hotkeys("1", () => navigate("/"));
    hotkeys("2", () => navigate("/relic"));
    hotkeys("3", () => navigate("/inventory"));
    hotkeys("shift+/", (e) => {
      e.preventDefault();
      useAppStore.getState().openShortcuts();
    });

    return () => {
      hotkeys.unbind("/");
      hotkeys.unbind("ctrl+k,cmd+k");
      hotkeys.unbind("1");
      hotkeys.unbind("2");
      hotkeys.unbind("3");
      hotkeys.unbind("shift+/");
    };
  }, [navigate, modal, t]);

  useEffect(() => {
    const pageName =
      location.pathname === "/relic" ? t("relicTracker") :
      location.pathname === "/inventory" ? t("inventoryTracker") :
      t("craftTracker");
    document.title = `WIT | ${pageName}`;
  }, [location.pathname]);

  // --- Render ---
  return (
    <>
      <div className="app-shell-layout">
        <Sidebar onOpenSettings={openThemeDrawer} />
        <AppHeader />

        <main className="app-content">
          <Routes>
            <Route path="/relic" element={
              <RelicTrackerContent watchedPrimes={watchedPrimes} onToggleFound={handleRelicToggleFound} />
            } />
            <Route path="/inventory" element={<InventoryTrackerContent />} />
            <Route path="*" element={
              <>
                <SummaryBar adjustedTotals={adjustedTotals} />

                <div className="content-header">
                  <div className="content-tabs">
                    <button className={`content-tab ${activeTab === "selected" ? "active" : ""}`} onClick={() => setActiveTab("selected")}>
                      {t("selected")} <span className="content-tab-badge">{selectedItems.length}</span>
                    </button>
                    <button className={`content-tab ${activeTab === "totals" ? "active" : ""}`} onClick={() => setActiveTab("totals")}>
                      {t("totals")} <span className="content-tab-badge">{adjustedTotals.length}</span>
                    </button>
                  </div>
                  <div className="content-actions">
                    <Button size="small" icon={<DownloadOutlined />} onClick={exportData} disabled={selectedItems.length === 0} title={t("exportData")} />
                    <Button size="small" icon={<UploadOutlined />} onClick={() => importInputRef.current?.click()} title={t("importData")} />
                    <Button size="small" icon={<CameraOutlined />} onClick={() => captureAndDownload('.app-content', `wit-${new Date().toISOString().slice(0,10)}.png`)} title="Screenshot" />
                    <input ref={importInputRef} type="file" accept="application/json" style={{ display: "none" }} onChange={importData} />
                    {selectedItems.length > 0 && (
                      <Button size="small" danger icon={<ClearOutlined />} onClick={confirmClearAll}>{t("clearAll")}</Button>
                    )}
                    <Button size="small" type="default" icon={<PlusOutlined />} onClick={openSearchDrawer}>{t("addItem")}</Button>
                  </div>
                </div>

                {activeTab === "selected" && (
                  <>
                    <div className="craft-toolbar">
                      <div className="craft-toolbar-left">
                        <div className="craft-search-compact">
                          <SearchOutlined className="craft-search-compact-icon" />
                          <input className="craft-search-compact-input" placeholder={t("search")} value={selectedSearch} onChange={(e) => setSelectedSearch(e.target.value)} />
                          {selectedSearch && (<button className="craft-search-clear" onClick={() => setSelectedSearch("")}>&times;</button>)}
                        </div>
                        {categoryOptions.length > 1 && (
                          <>
                            <div className="craft-toolbar-divider" />
                            <div className="craft-category-pills">
                              {categoryOptions.map((c) => (
                                <button key={c} className={`craft-category-pill ${selectedCategory === c ? "active" : ""}`} onClick={() => setSelectedCategory(c)}>
                                  {c === "all" ? t("allCategories") : c}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="craft-filter-group">
                        {["all", "open", "done"].map((f) => (
                          <button key={f} className={`craft-filter-btn ${selectedFilter === f ? "active" : ""}`} onClick={() => setSelectedFilter(f)}>
                            {t(f === "all" ? "completionAll" : f === "open" ? "completionOpen" : "completionDone")}
                          </button>
                        ))}
                      </div>
                    </div>
                    <ItemCardGrid items={filteredSelectedItems} enrichedByItem={enrichedByItem} onOpenDetail={setDetailItem} onRemoveItem={removeItemWithConfirm} />
                  </>
                )}

                {activeTab === "totals" && (
                  <>
                    <div className="craft-toolbar">
                      <div className="craft-toolbar-left">
                        <div className="craft-search-compact">
                          <SearchOutlined className="craft-search-compact-icon" />
                          <input className="craft-search-compact-input" placeholder={t("search")} value={totalsSearch} onChange={(e) => setTotalsSearch(e.target.value)} />
                          {totalsSearch && (<button className="craft-search-clear" onClick={() => setTotalsSearch("")}>&times;</button>)}
                        </div>
                      </div>
                      <div className="craft-filter-group">
                        {["all", "open", "done"].map((f) => (
                          <button key={f} className={`craft-filter-btn ${totalsFilter === f ? "active" : ""}`} onClick={() => setTotalsFilter(f)}>
                            {t(f === "all" ? "completionAll" : f === "open" ? "completionOpen" : "completionDone")}
                          </button>
                        ))}
                      </div>
                    </div>
                    <TotalsCardGrid adjustedTotals={filteredTotals} onOpenDetail={setDetailMaterial} />
                  </>
                )}
              </>
            } />
          </Routes>
        </main>
      </div>

      <SearchDrawer open={searchDrawerOpen} onClose={closeSearchDrawer} onAddItem={handleAddItem} />

      <ItemDetailModal
        item={detailItem} open={!!detailItem} onClose={() => setDetailItem(null)}
        enrichedRequirements={detailItem ? enrichedByItem.get(detailItem.uniqueName) || [] : []}
        onSetCompleted={setCompletedQuantity} onUpdateQuantity={updateQuantity}
      />

      <TotalDetailModal
        material={detailMaterial} open={!!detailMaterial} onClose={() => setDetailMaterial(null)}
        detailByItem={detailByItem} onSetCompleted={setCompletedQuantity} onBulkDonate={handleBulkDonate}
      />

      <ThemeDrawer />
      <WizardModal />
      <ShortcutsModal />
    </>
  );
}

function CraftApp() {
  const initialPersisted = normalizePersistedState(readStorage());

  // Hydrate all stores on mount (runs once via useState initializer)
  const [hydrated] = useState(() => {
    useAppStore.getState().hydrate(initialPersisted);
    useCraftStore.getState().hydrate(initialPersisted);
    useRelicStore.getState().hydrate(initialPersisted);
    useInventoryStore.getState().hydrate(initialPersisted);
    return true;
  });

  const themeName = useAppStore((s) => s.themeName);
  const customThemeTokens = useAppStore((s) => s.customThemeTokens);

  // Listen for theme changes from CraftAppContent via custom events
  useEffect(() => {
    function onThemeChange(e) {
      if (e.detail.themeName) useAppStore.getState().setThemeName(e.detail.themeName);
      if (e.detail.tokens) useAppStore.getState().setCustomThemeTokens(e.detail.tokens);
    }
    window.addEventListener("wf-theme-change", onThemeChange);
    return () => window.removeEventListener("wf-theme-change", onThemeChange);
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: themeOptions[themeName]?.algorithm || themeOptions.orokin.algorithm,
        token: customThemeTokens,
      }}
    >
      <AntApp>
        <CraftAppContent />
      </AntApp>
    </ConfigProvider>
  );
}

export default CraftApp;
