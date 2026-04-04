import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { App as AntApp, Button, ConfigProvider, Segmented, Select } from "antd";
import { PlusOutlined, DownloadOutlined, UploadOutlined, SearchOutlined, ClearOutlined } from "@ant-design/icons";
import { Routes, Route, useLocation } from "react-router-dom";
import { themeOptions } from "./constants/themes";
import { translate } from "./constants/i18n";
import {
  readStorage,
  normalizePersistedState,
  savePersistedState,
} from "./utils/storage";
import { requestJson, enrichRequirements } from "./utils/helpers";
import useItemI18n from "./hooks/useItemI18n";
import Sidebar from "./components/Sidebar";
import AppHeader from "./components/AppHeader";
import SummaryBar from "./components/SummaryBar";
import ItemCardGrid from "./components/ItemCardGrid";
import TotalsCardGrid from "./components/TotalsCardGrid";
import SearchDrawer from "./components/SearchDrawer";
import ThemeDrawer from "./components/ThemeDrawer";
import WizardModal from "./components/WizardModal";
import ItemDetailModal from "./components/ItemDetailModal";
import TotalDetailModal from "./components/TotalDetailModal";
import RelicTrackerContent from "./components/RelicTrackerContent";

function CraftAppContent() {
  const { message, modal } = AntApp.useApp();
  const initialPersisted = normalizePersistedState(readStorage());

  const [language, setLanguage] = useState(initialPersisted.language);
  const [themeName, setThemeName] = useState(initialPersisted.theme);
  const [customThemeTokens, setCustomThemeTokens] = useState(initialPersisted.customThemeTokens);
  const [themeProfiles, setThemeProfiles] = useState(initialPersisted.themeProfiles);
  const [selectedProfileName, setSelectedProfileName] = useState("");
  const [themeProfileInput, setThemeProfileInput] = useState("");
  const [themeDrawerOpen, setThemeDrawerOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(!initialPersisted.onboardingDone);
  const [isHydrated, setIsHydrated] = useState(true);

  const [selectedItems, setSelectedItems] = useState(initialPersisted.selectedItems);
  const [completionView, setCompletionView] = useState(initialPersisted.completionView);
  const [completedMap, setCompletedMap] = useState(initialPersisted.completedMap);
  const [calculation, setCalculation] = useState({ perItem: [], totals: [] });
  const [loadingCalc, setLoadingCalc] = useState(false);

  // Relic tracker: foundComponents still needs its own state, but watchedPrimes is derived
  const [foundComponents, setFoundComponents] = useState(initialPersisted.relicFoundComponents);

  // Derive watchedPrimes from selectedItems (no separate state)
  const watchedPrimes = useMemo(() =>
    selectedItems.filter((item) => item.name && item.name.toLowerCase().includes("prime")),
  [selectedItems]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("selected");
  const [detailItem, setDetailItem] = useState(null);
  const [detailMaterial, setDetailMaterial] = useState(null);
  const [selectedSearch, setSelectedSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [totalsSearch, setTotalsSearch] = useState("");
  const [totalsFilter, setTotalsFilter] = useState("all");
  const importInputRef = useRef(null);
  const t = (key, params) => translate(language, key, params);
  const tin = useItemI18n(language);


  // --- Persist ---
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
    });
  }, [
    language, themeName, customThemeTokens, themeProfiles,
    completionView, selectedItems, completedMap, wizardOpen,
    foundComponents,
  ]);

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
    root.style.setProperty(
      "--wf-scrollbar",
      customThemeTokens.colorScrollbar || customThemeTokens.colorBorder || "#2f4774",
    );
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
        if (!cancelled) message.error(error.message);
      } finally {
        if (!cancelled) setLoadingCalc(false);
      }
    }
    calculate();
    return () => { cancelled = true; };
  }, [selectedItems]);

  // --- Metadata resolution ---
  const missingMetadataNames = useMemo(() => {
    return selectedItems
      .filter((item) => {
        const cat = String(item.category || "").trim().toLowerCase();
        const typ = String(item.type || "").trim().toLowerCase();
        return (!cat || cat === "bilinmiyor" || cat === "unknown") && (!typ || typ === "bilinmiyor" || typ === "unknown");
      })
      .map((item) => item.uniqueName);
  }, [selectedItems]);

  useEffect(() => {
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
  }, [missingMetadataNames]);

  // --- Memoized data ---
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

  // --- Bidirectional sync: craft completion ↔ relic found ---
  // Warframe naming: craft uses "X Prime Helmet Component", relic uses "Neuroptics"
  const COMPONENT_ALIASES = {
    helmet: "neuroptics", neuroptics: "helmet",
  };

  function matchReqToComponent(reqName, componentName) {
    const rn = (reqName || "").toLowerCase();
    const cn = (componentName || "").toLowerCase();
    // Direct substring match
    if (rn.includes(cn) || cn.includes(rn)) return true;
    // Alias match (helmet ↔ neuroptics)
    const alias = COMPONENT_ALIASES[cn];
    if (alias && rn.includes(alias)) return true;
    const reverseAlias = COMPONENT_ALIASES[Object.keys(COMPONENT_ALIASES).find((k) => rn.includes(k))];
    if (reverseAlias && reverseAlias === cn) return true;
    return false;
  }

  // Unfiltered enrichment for sync (completionView filter can hide items)
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

  // Map craft requirement names → relic component names for each prime
  const STANDARD_COMPONENT_NAMES = ["Blueprint", "Chassis", "Neuroptics", "Systems",
    "Barrel", "Receiver", "Stock", "Blade", "Handle", "Head",
    "Upper Limb", "Lower Limb", "Grip", "String", "Pouch",
    "Link", "Band", "Buckle", "Gauntlet", "Boot",
    "Cerebrum", "Carapace"];

  const craftToRelicMap = useMemo(() => {
    const map = new Map();
    for (const item of watchedPrimes) {
      const reqs = detailByItem.get(item.uniqueName) || [];
      const reqMap = {};
      for (const req of reqs) {
        // Also check existing foundComponents keys
        const existingKeys = Object.keys(foundComponents[item.uniqueName] || {});
        const fromExisting = existingKeys.find((k) => matchReqToComponent(req.name, k));
        const fromStandard = STANDARD_COMPONENT_NAMES.find((sn) => matchReqToComponent(req.name, sn));
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
          if (!relicName) continue; // skip resources

          const currentFound = !!next[item.uniqueName][relicName];
          if (req.isDone !== currentFound) {
            next[item.uniqueName] = { ...next[item.uniqueName], [relicName]: req.isDone };
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [enrichedByItemUnfiltered, watchedPrimes, craftToRelicMap]);

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
      const remaining = Math.max(0, total.quantity - (deduction.get(total.uniqueName) || 0));
      const completedAmount = total.quantity - remaining;
      const completionPercent =
        total.quantity > 0 ? Math.round((completedAmount / total.quantity) * 100) : 100;
      const status = remaining === 0 ? "done" : completionPercent > 0 ? "partial" : "open";
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

  const filteredSelectedItems = useMemo(() => {
    const query = selectedSearch.trim().toLowerCase();
    return selectedItems.filter((item) => {
      const matchesQuery = !query || item.name.toLowerCase().includes(query) || item.uniqueName.toLowerCase().includes(query);
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
  }, [selectedItems, selectedSearch, selectedFilter, selectedCategory, enrichedByItem]);

  const filteredTotals = useMemo(() => {
    const query = totalsSearch.trim().toLowerCase();
    return adjustedTotals.filter((item) => {
      const matchesQuery = !query || item.name.toLowerCase().includes(query) || item.uniqueName.toLowerCase().includes(query);
      if (!matchesQuery) return false;
      if (totalsFilter === "all") return true;
      if (totalsFilter === "done") return item.status === "done";
      if (totalsFilter === "open") return item.status !== "done";
      return true;
    });
  }, [adjustedTotals, totalsSearch, totalsFilter]);

  // (old panel-specific memos removed — card grid doesn't need them)

  // --- Actions ---
  function addItem(item) {
    setSelectedItems((prev) => {
      const existing = prev.find((entry) => entry.uniqueName === item.uniqueName);
      if (existing) {
        return prev.map((entry) =>
          entry.uniqueName === item.uniqueName
            ? {
                ...entry,
                quantity: entry.quantity + 1,
                type: entry.type || item.type || item.category || null,
                category: entry.category || item.category || item.type || null,
              }
            : entry,
        );
      }
      return [
        ...prev,
        {
          uniqueName: item.uniqueName,
          name: item.name,
          imageUrl: item.imageUrl || null,
          type: item.type || null,
          category: item.category || item.type || null,
          buildPrice: item.buildPrice || 0,
          quantity: 1,
        },
      ];
    });
    message.success(`${item.name} +1`);
  }

  function removeItem(uniqueName) {
    setSelectedItems((prev) => prev.filter((i) => i.uniqueName !== uniqueName));
    setCompletedMap((prev) => {
      const next = { ...prev };
      delete next[uniqueName];
      return next;
    });
    setFoundComponents((prev) => {
      const next = { ...prev };
      delete next[uniqueName];
      return next;
    });
  }

  function updateQuantity(uniqueName, quantity) {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.uniqueName === uniqueName
          ? { ...item, quantity: Math.max(1, Number(quantity) || 1) }
          : item,
      ),
    );
  }

  function setCompletedQuantity(parentUniqueName, requirement, quantity) {
    const normalized = Math.min(requirement.quantity, Math.max(0, Number(quantity) || 0));
    setCompletedMap((prev) => ({
      ...prev,
      [parentUniqueName]: {
        ...(prev[parentUniqueName] || {}),
        [requirement.uniqueName]: normalized,
      },
    }));
  }

  // Relic toggle → also update craft completion
  function handleRelicToggleFound(primeUniqueName, componentName) {
    // Toggle relic found state
    setFoundComponents((prev) => {
      const primeMap = { ...(prev[primeUniqueName] || {}) };
      const newFound = !primeMap[componentName];
      primeMap[componentName] = newFound;

      // Sync to craft completedMap: find matching requirement by name
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

      return { ...prev, [primeUniqueName]: primeMap };
    });
  }

  function bulkDonate(resourceUniqueName, totalAmount) {
    const consumers = [];
    for (const parent of selectedItems) {
      const requirements = detailByItem.get(parent.uniqueName) || [];
      const req = requirements.find((r) => r.uniqueName === resourceUniqueName);
      if (!req) continue;
      const alreadyCompleted = Math.min(
        req.quantity,
        Math.max(0, Number(completedMap[parent.uniqueName]?.[resourceUniqueName]) || 0),
      );
      const remaining = req.quantity - alreadyCompleted;
      if (remaining > 0) {
        consumers.push({ parentUniqueName: parent.uniqueName, reqQuantity: req.quantity, alreadyCompleted, remaining });
      }
    }
    if (consumers.length === 0) return;
    let left = totalAmount;
    setCompletedMap((prev) => {
      const next = { ...prev };
      for (const c of consumers) {
        if (left <= 0) break;
        const give = Math.min(left, c.remaining);
        const newCompleted = Math.min(c.reqQuantity, c.alreadyCompleted + give);
        next[c.parentUniqueName] = {
          ...(next[c.parentUniqueName] || {}),
          [resourceUniqueName]: newCompleted,
        };
        left -= give;
      }
      return next;
    });
    message.success(t("bulkDonateSuccess", { name: "", amount: totalAmount }));
  }

  function removeItemWithConfirm(item) {
    modal.confirm({
      title: t("confirmRemoveTitle"),
      content: t("confirmRemoveContent", { name: item.name }),
      okText: t("confirmRemoveOk"),
      cancelText: t("confirmRemoveCancel"),
      okButtonProps: { danger: true },
      onOk: () => removeItem(item.uniqueName),
    });
  }

  function clearAllItems() {
    setSelectedItems([]);
    setCompletedMap({});
    setDetailItem(null);
    setDetailMaterial(null);
  }

  function confirmClearAll() {
    modal.confirm({
      title: t("confirmClearAllTitle"),
      content: t("confirmClearAllContent"),
      okText: t("confirmRemoveOk"),
      cancelText: t("confirmRemoveCancel"),
      okButtonProps: { danger: true },
      onOk: () => clearAllItems(),
    });
  }

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      selectedItems,
      completedMap,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wf-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    message.success(t("exportSuccess"));
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
          setCompletedMap(parsed.completedMap);
        }
        message.success(t("importSuccess"));
      } catch {
        message.error(t("importError"));
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  // --- Keyboard shortcuts ---
  useEffect(() => {
    function onKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const tagName = String(event.target?.tagName || "").toLowerCase();
      if (["input", "textarea", "select"].includes(tagName)) return;
      if (event.key === "/") {
        event.preventDefault();
        setSearchDrawerOpen(true);
      }
      if (event.key === "?") {
        event.preventDefault();
        modal.info({
          title: t("shortcuts"),
          content: (
            <ul style={{ listStyle: "none", padding: 0 }}>
              <li><code>/</code> — {t("searchPlaceholder")}</li>
              <li><code>?</code> — {t("shortcuts")}</li>
            </ul>
          ),
        });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // --- Render ---
  return (
    <>
      <div className="app-shell-layout">
        <Sidebar
          t={t}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          onOpenSettings={() => setThemeDrawerOpen(true)}
        />

        <AppHeader
          t={t}
          language={language}
          setLanguage={setLanguage}
          themeName={themeName}
          setThemeName={setThemeName}
          setCustomThemeTokens={setCustomThemeTokens}
          onOpenSettings={() => setThemeDrawerOpen(true)}
        />

        <main className="app-content">
          <Routes>
            <Route
              path="/relic"
              element={
                <RelicTrackerContent
                  t={t} tin={tin} language={language}
                  watchedPrimes={watchedPrimes}
                  foundComponents={foundComponents}
                  onToggleFound={handleRelicToggleFound}
                />
              }
            />
            <Route
              path="*"
              element={
                <>
                  <SummaryBar
                    t={t}
                    selectedItems={selectedItems}
                    adjustedTotals={adjustedTotals}
                  />

                  <div className="content-header">
                    <div className="content-tabs">
                      <button
                        className={`content-tab ${activeTab === "selected" ? "active" : ""}`}
                        onClick={() => setActiveTab("selected")}
                      >
                        {t("selected")} <span className="content-tab-badge">{selectedItems.length}</span>
                      </button>
                      <button
                        className={`content-tab ${activeTab === "totals" ? "active" : ""}`}
                        onClick={() => setActiveTab("totals")}
                      >
                        {t("totals")} <span className="content-tab-badge">{adjustedTotals.length}</span>
                      </button>
                    </div>
                    <div className="content-actions">
                      <Button size="small" icon={<DownloadOutlined />} onClick={exportData} disabled={selectedItems.length === 0} title={t("exportData")} />
                      <Button size="small" icon={<UploadOutlined />} onClick={() => importInputRef.current?.click()} title={t("importData")} />
                      <input ref={importInputRef} type="file" accept="application/json" style={{ display: "none" }} onChange={importData} />
                      {selectedItems.length > 0 && (
                        <Button size="small" danger icon={<ClearOutlined />} onClick={confirmClearAll}>
                          {t("clearAll")}
                        </Button>
                      )}
                      <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setSearchDrawerOpen(true)}>
                        {t("addItem")}
                      </Button>
                    </div>
                  </div>

                  {activeTab === "selected" && (
                    <>
                      <div className="craft-toolbar">
                        <div className="craft-toolbar-left">
                          <div className="craft-search-compact">
                            <SearchOutlined className="craft-search-compact-icon" />
                            <input
                              className="craft-search-compact-input"
                              placeholder={t("search")}
                              value={selectedSearch}
                              onChange={(e) => setSelectedSearch(e.target.value)}
                            />
                            {selectedSearch && (
                              <button className="craft-search-clear" onClick={() => setSelectedSearch("")}>&times;</button>
                            )}
                          </div>
                          {categoryOptions.length > 1 && (
                            <>
                              <div className="craft-toolbar-divider" />
                              <div className="craft-category-pills">
                                {categoryOptions.map((c) => (
                                  <button
                                    key={c}
                                    className={`craft-category-pill ${selectedCategory === c ? "active" : ""}`}
                                    onClick={() => setSelectedCategory(c)}
                                  >
                                    {c === "all" ? t("allCategories") : c}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        <div className="craft-filter-group">
                          {["all", "open", "done"].map((f) => (
                            <button
                              key={f}
                              className={`craft-filter-btn ${selectedFilter === f ? "active" : ""}`}
                              onClick={() => setSelectedFilter(f)}
                            >
                              {t(f === "all" ? "completionAll" : f === "open" ? "completionOpen" : "completionDone")}
                            </button>
                          ))}
                        </div>
                      </div>
                      <ItemCardGrid
                        t={t}
                        tin={tin}
                        items={filteredSelectedItems}
                        enrichedByItem={enrichedByItem}
                        onOpenDetail={setDetailItem}
                        onRemoveItem={removeItemWithConfirm}
                      />
                    </>
                  )}

                  {activeTab === "totals" && (
                    <>
                      <div className="craft-toolbar">
                        <div className="craft-toolbar-left">
                          <div className="craft-search-compact">
                            <SearchOutlined className="craft-search-compact-icon" />
                            <input
                              className="craft-search-compact-input"
                              placeholder={t("search")}
                              value={totalsSearch}
                              onChange={(e) => setTotalsSearch(e.target.value)}
                            />
                            {totalsSearch && (
                              <button className="craft-search-clear" onClick={() => setTotalsSearch("")}>&times;</button>
                            )}
                          </div>
                        </div>
                        <div className="craft-filter-group">
                          {["all", "open", "done"].map((f) => (
                            <button
                              key={f}
                              className={`craft-filter-btn ${totalsFilter === f ? "active" : ""}`}
                              onClick={() => setTotalsFilter(f)}
                            >
                              {t(f === "all" ? "completionAll" : f === "open" ? "completionOpen" : "completionDone")}
                            </button>
                          ))}
                        </div>
                      </div>
                      <TotalsCardGrid
                        t={t}
                        tin={tin}
                        adjustedTotals={filteredTotals}
                        loadingCalc={loadingCalc}
                        onOpenDetail={setDetailMaterial}
                      />
                    </>
                  )}
                </>
              }
            />
          </Routes>
        </main>
      </div>

      <SearchDrawer
        t={t}
        tin={tin}
        open={searchDrawerOpen}
        onClose={() => setSearchDrawerOpen(false)}
        onAddItem={(item) => {
          addItem(item);
        }}
      />

      <ItemDetailModal
        t={t}
        tin={tin}
        item={detailItem}
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        enrichedRequirements={detailItem ? enrichedByItem.get(detailItem.uniqueName) || [] : []}
        onSetCompleted={setCompletedQuantity}
        onUpdateQuantity={updateQuantity}
      />

      <TotalDetailModal
        t={t}
        tin={tin}
        material={detailMaterial}
        open={!!detailMaterial}
        onClose={() => setDetailMaterial(null)}
        selectedItems={selectedItems}
        detailByItem={detailByItem}
        completedMap={completedMap}
        onSetCompleted={setCompletedQuantity}
        onBulkDonate={bulkDonate}
      />

      <ThemeDrawer
        t={t}
        open={themeDrawerOpen}
        onClose={() => setThemeDrawerOpen(false)}
        themeName={themeName}
        setThemeName={setThemeName}
        customThemeTokens={customThemeTokens}
        setCustomThemeTokens={setCustomThemeTokens}
        themeProfiles={themeProfiles}
        setThemeProfiles={setThemeProfiles}
        selectedProfileName={selectedProfileName}
        setSelectedProfileName={setSelectedProfileName}
        themeProfileInput={themeProfileInput}
        setThemeProfileInput={setThemeProfileInput}
      />

      <WizardModal
        t={t}
        open={wizardOpen}
        language={language}
        setLanguage={setLanguage}
        themeName={themeName}
        setThemeName={setThemeName}
        setCustomThemeTokens={setCustomThemeTokens}
        onFinish={() => setWizardOpen(false)}
      />
    </>
  );
}

function CraftApp() {
  const persisted = normalizePersistedState(readStorage());
  const [themeName, setThemeNameOuter] = useState(persisted.theme);
  const [tokens, setTokensOuter] = useState(persisted.customThemeTokens);

  // Listen for theme changes from CraftAppContent via custom events
  useEffect(() => {
    function onThemeChange(e) {
      if (e.detail.themeName) setThemeNameOuter(e.detail.themeName);
      if (e.detail.tokens) setTokensOuter(e.detail.tokens);
    }
    window.addEventListener("wf-theme-change", onThemeChange);
    return () => window.removeEventListener("wf-theme-change", onThemeChange);
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: themeOptions[themeName]?.algorithm || themeOptions.orokin.algorithm,
        token: tokens,
      }}
    >
      <AntApp>
        <CraftAppContent />
      </AntApp>
    </ConfigProvider>
  );
}

export default CraftApp;
