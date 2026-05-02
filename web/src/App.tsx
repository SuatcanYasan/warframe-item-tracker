import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { App as AntApp, Button, ConfigProvider, Spin } from "antd";
import toast from "react-hot-toast";
import {
  PlusOutlined,
  DownloadOutlined,
  UploadOutlined,
  SearchOutlined,
  ClearOutlined,
  CameraOutlined,
  CheckSquareOutlined,
  CloseOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import hotkeys from "hotkeys-js";
import { themeOptions } from "./constants/themes";
import {
  readStorage,
  normalizePersistedState,
} from "./utils/storage";
import type { PersistedState } from "./types";
import { ensureSession } from "./lib/supabaseAuth";
import { pullAllState, pushAllState, markBootstrapReady } from "./lib/supabaseSync";
import { requestJson } from "./utils/helpers";
import { captureAndDownload } from "./utils/screenshot";
import { applyCursorVars } from "./utils/cursors";

import { useAppStore } from "./stores/appStore";
import { useCraftStore, CRAFT_IMAGE_MIGRATION_VERSION } from "./stores/craftStore";
import { useRelicStore } from "./stores/relicStore";
import { useInventoryStore, INVENTORY_IMAGE_MIGRATION_VERSION } from "./stores/inventoryStore";
import { useMasteryStore } from "./stores/masteryStore";
import { useAmpStore } from "./stores/ampStore";
import { useChecklistStore } from "./stores/checklistStore";
import { useFarmStore } from "./stores/farmStore";

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
import AppFooter from "./components/shared/AppFooter";
import AppErrorBoundary from "./components/shared/AppErrorBoundary";
import MobileNav from "./components/shared/MobileNav";
import SummaryBar from "./components/craft/SummaryBar";
import ItemCardGrid from "./components/craft/ItemCardGrid";
import TotalsCardGrid from "./components/craft/TotalsCardGrid";
import SearchDrawer from "./components/craft/SearchDrawer";
import HintPill from "./components/shared/HintPill";
import ThemeDrawer from "./components/shared/ThemeDrawer";
import WizardModal from "./components/shared/WizardModal";
import ShortcutsModal from "./components/shared/ShortcutsModal";
import CommandPalette from "./components/shared/CommandPalette";
import OnboardingTour from "./components/shared/OnboardingTour";
import UpdateNotesModal from "./components/shared/UpdateNotesModal";
import ShareModal from "./components/shared/ShareModal";
import SyncConflictModal from "./components/shared/SyncConflictModal";
import ItemDetailModal from "./components/craft/modals/ItemDetailModal";
import TotalDetailModal from "./components/craft/modals/TotalDetailModal";
// Route-level code splitting — each page ships as its own chunk.
// Dashboard stays eager since it's the default landing screen.
import DashboardPage from "./components/dashboard/DashboardPage";
const RelicTrackerContent = lazy(() => import("./components/relic/RelicPage"));
const InventoryTrackerContent = lazy(() => import("./components/inventory/InventoryPage"));
const MasteryPage = lazy(() => import("./components/mastery/MasteryPage"));
const IncarnonRotationPage = lazy(() => import("./components/incarnon/IncarnonRotationPage"));
const WFRotationPage = lazy(() => import("./components/wfrotation/WFRotationPage"));
const TimersPage = lazy(() => import("./components/timers/TimersPage"));
const AmpsPage = lazy(() => import("./components/amps/AmpsPage"));
const ActivitiesPage = lazy(() => import("./components/activities/ActivitiesPage"));
const ChecklistPage = lazy(() => import("./components/checklist/ChecklistPage"));
const FarmPlannerPage = lazy(() => import("./components/farm/FarmPlannerPage"));
const ArcaneTrackerPage = lazy(() => import("./components/arcane/ArcaneTrackerPage"));
const PrivacyPolicy = lazy(() => import("./components/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./components/legal/TermsOfService"));

const RouteFallback = () => (
  <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
    <Spin size="large" />
  </div>
);

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
  const multiSelectMode = useCraftStore((s) => s.multiSelectMode);
  const multiSelectedIds = useCraftStore((s) => s.multiSelectedIds);
  const toggleMultiSelect = useCraftStore((s) => s.toggleMultiSelect);
  const exitMultiSelect = useCraftStore((s) => s.exitMultiSelect);
  const selectAllMulti = useCraftStore((s) => s.selectAllMulti);
  const removeMultiSelected = useCraftStore((s) => s.removeMultiSelected);

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

  // --- RTL: toggle <html dir> + body class when language changes ---
  // Arabic is the only RTL locale we ship; everything else stays LTR.
  // AntD components pick up `direction` via ConfigProvider below; this
  // effect handles the document/body so our custom CSS can flip via
  // [dir=rtl] selectors in styles/rtl.css.
  const language = useAppStore((s) => s.language);
  useEffect(() => {
    const isRtl = language === "ar";
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.body.classList.toggle("rtl", isRtl);
  }, [language]);

  // --- Theme CSS vars ---
  useEffect(() => {
    document.body.setAttribute("data-theme", themeName);
    const root = document.documentElement;
    // Theme tokens are typed loosely (Record<string, unknown>) since they
    // come from a JSON source — cast each color string for the DOM API.
    const tokens = customThemeTokens as Record<string, string | number | undefined>;
    root.style.setProperty("--wf-bg-base", String(tokens.colorBgBase || "#0b1220"));
    root.style.setProperty("--wf-bg-container", String(tokens.colorBgContainer || "#111b34"));
    root.style.setProperty("--wf-bg-elevated", String(tokens.colorBgElevated || "#152344"));
    root.style.setProperty("--wf-text", String(tokens.colorText || "#eaf0ff"));
    root.style.setProperty("--wf-text-muted", String(tokens.colorTextSecondary || "#9db2da"));
    root.style.setProperty("--wf-border", String(tokens.colorBorder || "#2f4774"));
    root.style.setProperty("--wf-scrollbar", String(tokens.colorScrollbar || tokens.colorBorder || "#2f4774"));
    root.style.setProperty("--wf-primary", String(tokens.colorPrimary || "#CA8A04"));
    applyCursorVars(String(tokens.colorCursor || tokens.colorPrimary || "#CA8A04"));
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
        const data = await requestJson<{ perItem?: unknown[]; totals?: unknown[] }>("/api/calculate", {
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
      } catch (error: unknown) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : String(error));
      } finally {
        if (!cancelled) setLoadingCalc(false);
      }
    }
    calculate();
    return () => { cancelled = true; };
  }, [selectedItems]);

  // --- Metadata + image-URL refresh ---
  // Two cases trigger this:
  //   1. Item has missing/unknown category or type (legacy data shape)
  //   2. Local image-migration version is below CRAFT_IMAGE_MIGRATION_VERSION
  //      — runs once after each WFCD asset hash bump so stored 403/404
  //      imageUrls get refreshed in place (the user keeps their craft list,
  //      just the broken image disappears).
  const imageMigrationVersion = useCraftStore((s) => s.imageMigrationVersion);
  const setImageMigrationVersion = useCraftStore((s) => s.setImageMigrationVersion);
  useEffect(() => {
    if (selectedItems.length === 0) return;
    const needsMigration = imageMigrationVersion < CRAFT_IMAGE_MIGRATION_VERSION;
    const namesNeedingMetadata = selectedItems
      .filter((item) => {
        const cat = String(item.category || "").trim().toLowerCase();
        const typ = String(item.type || "").trim().toLowerCase();
        return (!cat || cat === "bilinmiyor" || cat === "unknown") && (!typ || typ === "bilinmiyor" || typ === "unknown");
      })
      .map((item) => item.uniqueName);
    const targetNames = needsMigration
      ? selectedItems.map((i) => i.uniqueName)
      : namesNeedingMetadata;
    if (targetNames.length === 0) return;

    let cancelled = false;
    requestJson<{ itemsByUniqueName?: Record<string, { type?: string; category?: string; imageUrl?: string }> }>("/api/items/resolve-metadata", {
      method: "POST",
      body: JSON.stringify({ uniqueNames: targetNames }),
    }).then((data) => {
      if (cancelled) return;
      const resolved = data?.itemsByUniqueName || {};
      setSelectedItems((prev) => {
        let changed = false;
        const next = prev.map((item) => {
          const r = resolved[item.uniqueName];
          if (!r) return item;
          const nextType = item.type || r.type || null;
          const nextCategory = item.category || r.category || r.type || null;
          // During an image migration, prefer the fresh server URL over
          // the stored one (it's likely 403/404). Otherwise keep what we
          // have so we don't make pointless writes.
          const nextImageUrl = needsMigration
            ? (r.imageUrl || item.imageUrl || null)
            : (item.imageUrl || r.imageUrl || null);
          if (nextType === item.type && nextCategory === item.category && nextImageUrl === item.imageUrl) return item;
          changed = true;
          return { ...item, type: nextType, category: nextCategory, imageUrl: nextImageUrl };
        });
        return changed ? next : prev;
      });
      if (needsMigration) setImageMigrationVersion(CRAFT_IMAGE_MIGRATION_VERSION);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [selectedItems, imageMigrationVersion, setImageMigrationVersion, setSelectedItems]);

  // Inventory image migration — same pattern as craft, but the URL we
  // need to refresh is `parentImageUrl` (parts share the parent item
  // image). We resolve by parentUniqueName since that's what /api/items
  // returns image data for.
  const inventoryImageVersion = useInventoryStore((s) => s.imageMigrationVersion);
  const setInventoryImageVersion = useInventoryStore((s) => s.setImageMigrationVersion);
  useEffect(() => {
    if (inventoryImageVersion >= INVENTORY_IMAGE_MIGRATION_VERSION) return;
    const parts = useInventoryStore.getState().inventoryParts;
    const partUniqueNames = Object.keys(parts);
    if (partUniqueNames.length === 0) return;
    const parentUns = [...new Set(
      partUniqueNames.map((un) => parts[un]?.parentUniqueName).filter(Boolean),
    )];
    if (parentUns.length === 0) return;

    let cancelled = false;
    requestJson<{ itemsByUniqueName?: Record<string, { imageUrl?: string }> }>("/api/items/resolve-metadata", {
      method: "POST",
      body: JSON.stringify({ uniqueNames: parentUns }),
    }).then((data) => {
      if (cancelled) return;
      const resolved = data?.itemsByUniqueName || {};
      useInventoryStore.getState().setInventoryParts((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const un of Object.keys(next)) {
          const part = next[un];
          const parent = resolved[part.parentUniqueName];
          if (!parent || !parent.imageUrl) continue;
          if (parent.imageUrl !== part.parentImageUrl) {
            next[un] = { ...part, parentImageUrl: parent.imageUrl };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
      setInventoryImageVersion(INVENTORY_IMAGE_MIGRATION_VERSION);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [inventoryImageVersion, setInventoryImageVersion]);

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
      const target = (event.target || (event as KeyboardEvent & { srcElement?: Element }).srcElement) as Element | null;
      const tagName = target?.tagName || "";
      return !["INPUT", "TEXTAREA", "SELECT"].includes(tagName);
    };

    hotkeys("/", (e) => {
      e.preventDefault();
      useCraftStore.getState().openSearchDrawer();
    });
    hotkeys("ctrl+space,cmd+space", (e) => {
      e.preventDefault();
      useCraftStore.getState().openSearchDrawer();
    });
    // Cmd/Ctrl+K is owned by CommandPalette (industry-standard binding —
    // VS Code, Linear, GitHub). Shortcuts modal stays on `?` only.
    // hotkeys-js callbacks expect `boolean | void` — wrap navigate so the
    // implicit Promise<void> return doesn't fail the callback type check.
    hotkeys("0", () => { navigate("/"); });
    hotkeys("1", () => { navigate("/craft"); });
    hotkeys("2", () => { navigate("/relic"); });
    hotkeys("3", () => { navigate("/inventory"); });
    hotkeys("4", () => { navigate("/mastery"); });
    hotkeys("5", () => { navigate("/timers"); });
    hotkeys("shift+/", (e) => {
      e.preventDefault();
      useAppStore.getState().openShortcuts();
    });

    return () => {
      hotkeys.unbind("/");
      hotkeys.unbind("ctrl+space,cmd+space");
      hotkeys.unbind("0");
      hotkeys.unbind("1");
      hotkeys.unbind("2");
      hotkeys.unbind("3");
      hotkeys.unbind("4");
      hotkeys.unbind("5");
      hotkeys.unbind("shift+/");
    };
  }, [navigate, modal, t]);

  useEffect(() => {
    const pageName =
      location.pathname === "/craft" ? t("craftTracker") :
      location.pathname === "/relic" ? t("relicTracker") :
      location.pathname === "/inventory" ? t("inventoryTracker") :
      location.pathname === "/mastery" ? t("masteryTracker") :
      location.pathname === "/timers" ? t("timersTracker") :
      t("dashboard");
    document.title = `WIT | ${pageName}`;
  }, [location.pathname]);

  // --- Render ---
  return (
    <>
      <a href="#main-content" className="skip-link">{t("skipToMain")}</a>
      <div className="app-shell-layout">
        <Sidebar onOpenSettings={openThemeDrawer} />
        <AppHeader />

        <main className="app-content" id="main-content" tabIndex={-1}>
          <AppErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/relic" element={
              <RelicTrackerContent watchedPrimes={watchedPrimes} onToggleFound={handleRelicToggleFound} />
            } />
            <Route path="/inventory" element={<InventoryTrackerContent />} />
            <Route path="/mastery" element={<MasteryPage />} />
            {/* Legacy redirect — MR XP is now a tab inside /mastery */}
            <Route path="/mr-calculator" element={<MasteryPage />} />
            <Route path="/incarnon" element={<IncarnonRotationPage />} />
            <Route path="/warframe-rotation" element={<WFRotationPage />} />
            <Route path="/timers" element={<TimersPage />} />
            <Route path="/amps" element={<AmpsPage />} />
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/checklist" element={<ChecklistPage />} />
            <Route path="/farm" element={<FarmPlannerPage />} />
            <Route path="/arcanes" element={<ArcaneTrackerPage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/craft" element={
              <>
                {selectedItems.length > 0 && (
                  <HintPill
                    id="command-palette-2026"
                    title={t("hintDidYouKnow")}
                    description={t("hintCommandPalette")}
                  />
                )}
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
                    {multiSelectMode ? (
                      <>
                        <span className="multi-select-count">{multiSelectedIds.size} {t("multiSelected")}</span>
                        <Button size="small" onClick={() => selectAllMulti(selectedItems.map((i) => i.uniqueName))}>{t("multiSelectAll")}</Button>
                        <Button size="small" danger icon={<DeleteOutlined />} disabled={multiSelectedIds.size === 0} onClick={() => {
                          if (multiSelectedIds.size > 0) {
                            modal.confirm({
                              title: t("confirmRemoveTitle"),
                              content: t("multiRemoveContent", { count: multiSelectedIds.size }),
                              okText: t("confirmRemoveOk"),
                              cancelText: t("confirmRemoveCancel"),
                              okButtonProps: { danger: true },
                              onOk: () => removeMultiSelected(),
                            });
                          }
                        }}>{t("multiRemove")}</Button>
                        <Button size="small" icon={<CloseOutlined />} onClick={exitMultiSelect}>{t("multiCancel")}</Button>
                      </>
                    ) : (
                      <>
                        {selectedItems.length > 1 && (
                          <Button size="small" icon={<CheckSquareOutlined />} onClick={toggleMultiSelect}>{t("multiSelect")}</Button>
                        )}
                        <Button size="small" icon={<DownloadOutlined />} onClick={exportData} disabled={selectedItems.length === 0} title={t("exportData")} />
                        <Button size="small" icon={<UploadOutlined />} onClick={() => importInputRef.current?.click()} title={t("importData")} />
                        <Button size="small" icon={<CameraOutlined />} onClick={() => captureAndDownload('.app-content', `wit-${new Date().toISOString().slice(0,10)}.png`)} title="Screenshot" />
                        <input ref={importInputRef} type="file" accept="application/json" style={{ display: "none" }} onChange={importData} />
                        {selectedItems.length > 0 && (
                          <Button size="small" danger icon={<ClearOutlined />} onClick={confirmClearAll}>{t("clearAll")}</Button>
                        )}
                        <Button size="small" type="default" icon={<PlusOutlined />} onClick={openSearchDrawer}>{t("addItem")}</Button>
                      </>
                    )}
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
                        {(["all", "open", "done"] as const).map((f) => (
                          <button key={f} className={`craft-filter-btn ${selectedFilter === f ? "active" : ""}`} onClick={() => setSelectedFilter(f)}>
                            {t(f === "all" ? "completionAll" : f === "open" ? "completionOpen" : "completionDone")}
                          </button>
                        ))}
                      </div>
                    </div>
                    <ItemCardGrid items={filteredSelectedItems} enrichedByItem={enrichedByItem} onOpenDetail={setDetailItem} onRemoveItem={removeItemWithConfirm} onOpenSearchDrawer={openSearchDrawer} />
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
                        {(["all", "open", "done"] as const).map((f) => (
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
          </Suspense>
          </AppErrorBoundary>
          <div className="app-content-spacer" />
          <AppFooter />
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
      <CommandPalette />
      <OnboardingTour />
      <UpdateNotesModal />
      <ShareModal />
      <MobileNav />
    </>
  );
}

// ---- Sync conflict helpers (used by bootstrap + modal handlers) ----

function hasMeaningfulData(state) {
  return (
    (state.selectedItems?.length || 0) > 0 ||
    Object.keys(state.masteredItems || {}).length > 0 ||
    Object.keys(state.inventoryParts || {}).length > 0 ||
    (state.trackedSets?.length || 0) > 0 ||
    (state.checklistItems?.length || 0) > 0 ||
    (state.farmResources?.length || 0) > 0 ||
    Object.keys(state.relicFoundComponents || {}).length > 0
  );
}

function statesDiffer(local, cloud) {
  // Quick count-based diff — different totals mean we should prompt the
  // user instead of silently picking one. Catches both "local has more"
  // and "cloud has more" scenarios.
  const fields = [
    [(local.selectedItems || []).length, (cloud.selectedItems || []).length],
    [Object.keys(local.masteredItems || {}).length, Object.keys(cloud.masteredItems || {}).length],
    [Object.keys(local.inventoryParts || {}).length, Object.keys(cloud.inventoryParts || {}).length],
    [(local.trackedSets || []).length, (cloud.trackedSets || []).length],
    [(local.checklistItems || []).length, (cloud.checklistItems || []).length],
    [(local.farmResources || []).length, (cloud.farmResources || []).length],
    [Object.keys(local.relicFoundComponents || {}).length, Object.keys(cloud.relicFoundComponents || {}).length],
  ];
  return fields.some(([l, c]) => l !== c);
}

function hydrateAllStores(persisted) {
  const normalized = normalizePersistedState(persisted);
  useAppStore.getState().hydrate(normalized);
  useCraftStore.getState().hydrate(normalized);
  useRelicStore.getState().hydrate(normalized);
  useInventoryStore.getState().hydrate(normalized);
  useMasteryStore.getState().hydrate(normalized);
  useAmpStore.getState().hydrate(normalized);
  useChecklistStore.getState().hydrate(normalized);
  useFarmStore.getState().hydrate(normalized);
}

async function preWarmCloudHashes() {
  // Re-read from stores after hydrate (some hydrate methods normalize/clean
  // data, so the post-hydrate shape may differ from the raw input).
  const app = useAppStore.getState();
  const craft = useCraftStore.getState();
  const amp = useAmpStore.getState();
  await pushAllState({
    language: app.language,
    theme: app.themeName,
    customThemeTokens: app.customThemeTokens,
    themeProfiles: app.themeProfiles,
    completionView: craft.completionView,
    selectedItems: craft.selectedItems,
    completedMap: craft.completedMap,
    onboardingDone: !app.wizardOpen,
    relicWatchedPrimes: [],
    relicFoundComponents: useRelicStore.getState().foundComponents,
    inventoryParts: useInventoryStore.getState().inventoryParts,
    masteredItems: useMasteryStore.getState().masteredItems,
    trackedSets: amp.trackedSets,
    masteryParts: amp.masteryParts,
    completedMaterials: amp.completedMaterials,
    checklistItems: useChecklistStore.getState().items,
    farmResources: useFarmStore.getState().trackedResources,
    incarnonClaimed: {},
    wfRotationClaimed: {},
    arcaneCounts: {},
    storedVersion: app.storedVersion,
  }, { markOnly: true });
}

function CraftApp() {
  const { t } = useTranslate();
  const initialPersisted = normalizePersistedState(readStorage());

  // Hydrate all stores on mount (runs once via useState initializer)
  const [hydrated] = useState(() => {
    useAppStore.getState().hydrate(initialPersisted);
    useCraftStore.getState().hydrate(initialPersisted);
    useRelicStore.getState().hydrate(initialPersisted);
    useInventoryStore.getState().hydrate(initialPersisted);
    useMasteryStore.getState().hydrate(initialPersisted);
    useAmpStore.getState().hydrate(initialPersisted);
    useChecklistStore.getState().hydrate(initialPersisted);
    useFarmStore.getState().hydrate(initialPersisted);
    // If the app was opened with a #share=... URL, queue the import.
    if (typeof window !== "undefined") {
      const match = window.location.hash.match(/#share=([^&]+)/);
      if (match && match[1]) {
        useAppStore.getState().setPendingImport(match[1]);
      }
    }
    return true;
  });

  const themeName = useAppStore((s) => s.themeName);
  const customThemeTokens = useAppStore((s) => s.customThemeTokens);
  const language = useAppStore((s) => s.language);

  // Listen for theme changes from CraftAppContent via custom events
  useEffect(() => {
    function onThemeChange(e) {
      if (e.detail.themeName) useAppStore.getState().setThemeName(e.detail.themeName);
      if (e.detail.tokens) useAppStore.getState().setCustomThemeTokens(e.detail.tokens);
    }
    window.addEventListener("wf-theme-change", onThemeChange);
    return () => window.removeEventListener("wf-theme-change", onThemeChange);
  }, []);

  // Cloud sync bootstrap: sign the user in (anonymous by default) and
  // reconcile local state with whatever's on Supabase.
  //   - cloud has data → pull + hydrate stores
  //   - cloud empty, local has data → push local up as first-time migration
  //   - both empty → nothing to do
  // No-op if Supabase env vars are missing — app stays local-only PWA.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Surface OAuth error redirects as a toast so the user understands
      // what happened. Most common: `identity_already_exists` — user hit
      // "Register" but the Google account is already linked. They should
      // use "Sign In" instead.
      const qp = new URLSearchParams(window.location.search);
      const hp = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const errorCode = qp.get("error_code") || hp.get("error_code");
      if (errorCode) {
        window.history.replaceState({}, "", window.location.pathname);
        if (errorCode === "identity_already_exists") {
          toast.error(t("accountRegisterErrorAlreadyExists"), { duration: 6000 });
        } else {
          const desc = qp.get("error_description") || hp.get("error_description");
          toast.error(desc ? decodeURIComponent(desc.replace(/\+/g, " ")) : errorCode, { duration: 6000 });
        }
      }

      const session = await ensureSession();
      if (!session || cancelled) return;

      const cloud = await pullAllState();
      if (cancelled) return;

      const localHasData = hasMeaningfulData(initialPersisted);

      // Cloud empty — first login on this account with local data. Migrate up.
      if (!cloud || cloud.empty) {
        if (localHasData) await pushAllState(initialPersisted);
        markBootstrapReady();
        return;
      }

      // Both sides have data — show modal whenever they differ in any
      // meaningful way. User picks which one wins. Silent hydration only
      // happens when local is empty OR counts match exactly (nothing to
      // lose either way).
      const cloudState = cloud.state as PersistedState;
      const conflict = localHasData && statesDiffer(initialPersisted, cloudState);
      if (conflict) {
        useAppStore.getState().setSyncConflict({ local: initialPersisted, cloud: cloudState });
        return;  // bootstrap stays gated until user picks
      }

      // No conflict: hydrate from cloud, pre-warm hashes.
      hydrateAllStores(cloudState);
      await preWarmCloudHashes();
      markBootstrapReady();
    })();
    return () => { cancelled = true; };
  }, []);

  // If Supabase is disabled or ensureSession fails, gate still needs to
  // open so usePersist doesn't block local-only users forever.
  useEffect(() => {
    const t = setTimeout(markBootstrapReady, 5000);
    return () => clearTimeout(t);
  }, []);

  // Sync conflict resolution. Modal shows local + cloud counts; user picks
  // one to win. Local wins → push local up (merges into cloud). Cloud wins
  // → hydrate stores from cloud. Either way: clear conflict, mark bootstrap
  // ready so usePersist resumes normal sync.
  const handleUseLocal = async () => {
    const { syncConflict, clearSyncConflict } = useAppStore.getState();
    if (!syncConflict) return;
    hydrateAllStores(syncConflict.local);
    await pushAllState(syncConflict.local);
    clearSyncConflict();
    markBootstrapReady();
  };
  const handleUseCloud = async () => {
    const { syncConflict, clearSyncConflict } = useAppStore.getState();
    if (!syncConflict) return;
    hydrateAllStores(syncConflict.cloud);
    await preWarmCloudHashes();
    clearSyncConflict();
    markBootstrapReady();
  };

  return (
    <ConfigProvider
      direction={language === "ar" ? "rtl" : "ltr"}
      theme={{
        algorithm: themeOptions[themeName]?.algorithm || themeOptions.orokin.algorithm,
        token: { fontFamily: "'Exo 2', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif", ...customThemeTokens },
      }}
    >
      <AntApp>
        <CraftAppContent />
        <SyncConflictModal onUseLocal={handleUseLocal} onUseCloud={handleUseCloud} />
      </AntApp>
    </ConfigProvider>
  );
}

export default CraftApp;
