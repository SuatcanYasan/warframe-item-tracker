import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { App as AntApp, ConfigProvider, Space } from "antd";
import { themeOptions } from "./constants/themes";
import { translate } from "./constants/i18n";
import {
  readStorage,
  normalizePersistedState,
  getPersistedState,
  savePersistedState,
} from "./utils/storage";
import { requestJson, enrichRequirements, makeRequirementKey } from "./utils/helpers";
import useItemI18n from "./hooks/useItemI18n";
import useResizablePanels from "./hooks/useResizablePanels";
import Header from "./components/Header";
import SearchPanel from "./components/SearchPanel";
import SelectedPanel from "./components/SelectedPanel";
import TotalsPanel from "./components/TotalsPanel";
import ThemeDrawer from "./components/ThemeDrawer";
import WizardModal from "./components/WizardModal";
import Footer from "./components/Footer";

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
  const [isHydrated, setIsHydrated] = useState(!window.wfDesktop?.isDesktop);

  const [selectedSearch, setSelectedSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState(initialPersisted.selectedItems);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(
    initialPersisted.selectedCategoryFilter,
  );
  const [activeKeys, setActiveKeys] = useState(initialPersisted.activeKeys);
  const [activeSelected, setActiveSelected] = useState(initialPersisted.activeSelected);
  const [completionView, setCompletionView] = useState(initialPersisted.completionView);

  const [completedMap, setCompletedMap] = useState(initialPersisted.completedMap);
  const [calculation, setCalculation] = useState({ perItem: [], totals: [] });
  const [loadingCalc, setLoadingCalc] = useState(false);
  const [focusRequirementKey, setFocusRequirementKey] = useState(null);
  const [focusedTotalRequirement, setFocusedTotalRequirement] = useState(null);
  const [panelOrder, setPanelOrder] = useState(initialPersisted.panelOrder);
  const [draggedPanel, setDraggedPanel] = useState(null);

  const searchInputRef = useRef(null);
  const requirementRefs = useRef(new Map());
  const { widths: panelWidths, setWidths: setPanelWidths, containerRef, onResizeStart } =
    useResizablePanels(initialPersisted.panelWidths);
  const lastAutoFocusRequirementRef = useRef(null);
  const t = (key, params) => translate(language, key, params);
  const tin = useItemI18n(language);

  // --- Hydration ---
  useEffect(() => {
    if (isHydrated) return undefined;
    let cancelled = false;
    getPersistedState().then((persistedState) => {
      if (cancelled) return;
      setLanguage(persistedState.language);
      setThemeName(persistedState.theme);
      setCustomThemeTokens(persistedState.customThemeTokens);
      setThemeProfiles(persistedState.themeProfiles);
      setCompletionView(persistedState.completionView);
      setSelectedItems(persistedState.selectedItems);
      setSelectedCategoryFilter(persistedState.selectedCategoryFilter || "all");
      setActiveKeys(persistedState.activeKeys);
      setCompletedMap(persistedState.completedMap);
      setActiveSelected(persistedState.activeSelected || null);
      setWizardOpen(!persistedState.onboardingDone);
      setPanelWidths(persistedState.panelWidths);
      setPanelOrder(persistedState.panelOrder);
      setIsHydrated(true);
    });
    return () => { cancelled = true; };
  }, [isHydrated]);

  // --- Persist ---
  useEffect(() => {
    if (!isHydrated) return;
    savePersistedState({
      language,
      theme: themeName,
      customThemeTokens,
      themeProfiles,
      completionView,
      selectedItems,
      selectedCategoryFilter,
      activeKeys,
      completedMap,
      activeSelected,
      onboardingDone: !wizardOpen,
      panelWidths,
      panelOrder,
    });
  }, [
    isHydrated, language, themeName, customThemeTokens, themeProfiles,
    completionView, selectedItems, selectedCategoryFilter, activeKeys,
    completedMap, activeSelected, wizardOpen, panelWidths, panelOrder,
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

  const selectedCategoryOptions = useMemo(() => {
    const optionMap = new Map();
    for (const item of selectedItems) {
      const label = item.category || item.type || t("unknown");
      const value = label.toLowerCase();
      if (!optionMap.has(value)) optionMap.set(value, label);
    }
    const sorted = Array.from(optionMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
    return [{ value: "all", label: t("allCategories") }, ...sorted];
  }, [selectedItems, language]);

  const requirementParentMap = useMemo(() => {
    const map = new Map();
    for (const item of calculation.perItem || []) {
      for (const requirement of item.requirements || []) {
        if (!map.has(requirement.uniqueName)) map.set(requirement.uniqueName, new Set());
        map.get(requirement.uniqueName).add(item.uniqueName);
      }
    }
    return map;
  }, [calculation.perItem]);

  const focusedRequirementParents = useMemo(() => {
    if (!focusedTotalRequirement?.uniqueName) return null;
    return requirementParentMap.get(focusedTotalRequirement.uniqueName) || new Set();
  }, [focusedTotalRequirement, requirementParentMap]);

  const filteredSelectedItems = useMemo(() => {
    const normalizedQuery = selectedSearch.trim().toLowerCase();
    const normalizedCategory = selectedCategoryFilter;
    return selectedItems.filter((item) => {
      if (focusedRequirementParents) {
        return focusedRequirementParents.has(item.uniqueName);
      }
      const categoryLabel = (item.category || item.type || t("unknown")).toLowerCase();
      const matchesQuery =
        !normalizedQuery ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.uniqueName.toLowerCase().includes(normalizedQuery);
      const matchesCategory = normalizedCategory === "all" || categoryLabel === normalizedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [selectedItems, selectedSearch, selectedCategoryFilter, focusedRequirementParents, language]);

  // --- Focus effects ---
  useEffect(() => {
    const focusedKey = focusedTotalRequirement?.uniqueName || null;
    if (!focusedKey) {
      lastAutoFocusRequirementRef.current = null;
      return;
    }
    const matchedItems = selectedItems.filter((item) => focusedRequirementParents?.has(item.uniqueName));
    if (matchedItems.length === 0) return;
    if (lastAutoFocusRequirementRef.current !== focusedKey) {
      setActiveKeys((prev) => {
        const next = new Set(prev);
        for (const item of matchedItems) next.add(item.uniqueName);
        return Array.from(next);
      });
      setActiveSelected(matchedItems[0].uniqueName);
      lastAutoFocusRequirementRef.current = focusedKey;
      return;
    }
    if (!activeSelected || !focusedRequirementParents?.has(activeSelected)) {
      setActiveSelected(matchedItems[0].uniqueName);
    }
  }, [focusedTotalRequirement, focusedRequirementParents, selectedItems, activeSelected]);

  useEffect(() => {
    if (!focusedTotalRequirement?.uniqueName) return;
    if ((focusedRequirementParents?.size || 0) === 0) setFocusedTotalRequirement(null);
  }, [focusedTotalRequirement, focusedRequirementParents]);

  // --- Metadata resolution ---
  const missingSelectedMetadataUniqueNames = useMemo(() => {
    return selectedItems
      .filter((item) => {
        const category = String(item.category || "").trim().toLowerCase();
        const type = String(item.type || "").trim().toLowerCase();
        const hasCategory = category.length > 0 && category !== "bilinmiyor" && category !== "unknown";
        const hasType = type.length > 0 && type !== "bilinmiyor" && type !== "unknown";
        return !hasCategory && !hasType;
      })
      .map((item) => item.uniqueName);
  }, [selectedItems]);

  useEffect(() => {
    if (missingSelectedMetadataUniqueNames.length === 0) return;
    let cancelled = false;
    async function resolveMissingSelectedMetadata() {
      try {
        const data = await requestJson("/api/items/resolve-metadata", {
          method: "POST",
          body: JSON.stringify({ uniqueNames: missingSelectedMetadataUniqueNames }),
        });
        if (cancelled) return;
        const itemsByUniqueName =
          data?.itemsByUniqueName && typeof data.itemsByUniqueName === "object"
            ? data.itemsByUniqueName : {};
        if (Object.keys(itemsByUniqueName).length === 0) return;
        setSelectedItems((prev) => {
          let changed = false;
          const next = prev.map((item) => {
            const resolved = itemsByUniqueName[item.uniqueName];
            if (!resolved) return item;
            const nextType = item.type || resolved.type || null;
            const nextCategory = item.category || resolved.category || resolved.type || null;
            const nextName = item.name || resolved.name || item.name;
            const nextImageUrl = item.imageUrl || resolved.imageUrl || null;
            if (
              nextType === item.type && nextCategory === item.category &&
              nextName === item.name && nextImageUrl === item.imageUrl
            ) return item;
            changed = true;
            return { ...item, type: nextType, category: nextCategory, name: nextName, imageUrl: nextImageUrl };
          });
          return changed ? next : prev;
        });
      } catch {
        // Keep UI responsive when metadata resolution fails.
      }
    }
    resolveMissingSelectedMetadata();
    return () => { cancelled = true; };
  }, [missingSelectedMetadataUniqueNames]);

  useEffect(() => {
    if (selectedCategoryFilter === "all") return;
    const stillExists = selectedCategoryOptions.some((o) => o.value === selectedCategoryFilter);
    if (!stillExists) setSelectedCategoryFilter("all");
  }, [selectedCategoryFilter, selectedCategoryOptions]);

  // --- Auto-focus requirement ---
  useEffect(() => {
    if (!activeSelected || !activeKeys.includes(activeSelected)) {
      setFocusRequirementKey(null);
      return;
    }
    const entries = enrichedByItem.get(activeSelected) || [];
    const firstMissing = entries.find((entry) => !entry.isDone);
    if (!firstMissing) {
      setFocusRequirementKey(null);
      return;
    }
    const key = makeRequirementKey(activeSelected, firstMissing.uniqueName);
    setFocusRequirementKey(key);
    requestAnimationFrame(() => {
      const targetNode = requirementRefs.current.get(key);
      if (targetNode) targetNode.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }, [activeSelected, activeKeys, enrichedByItem]);

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
          quantity: 1,
        },
      ];
    });
    setActiveSelected(item.uniqueName);
    message.success(`${item.name} +1`);
  }

  function removeItem(uniqueName) {
    setSelectedItems((prev) => prev.filter((item) => item.uniqueName !== uniqueName));
    setCompletedMap((prev) => {
      const next = { ...prev };
      delete next[uniqueName];
      return next;
    });
    setActiveKeys((prev) => prev.filter((key) => key !== uniqueName));
    if (activeSelected === uniqueName) setActiveSelected(null);
  }

  function clearAllItems() {
    setSelectedItems([]);
    setCompletedMap({});
    setActiveKeys([]);
    setActiveSelected(null);
    setFocusedTotalRequirement(null);
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

  function bulkDonate(resourceUniqueName, totalAmount) {
    // Find all selected items that need this resource and distribute the amount
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
  }

  function importBackupData(data) {
    if (Array.isArray(data.selectedItems)) {
      setSelectedItems(data.selectedItems);
    }
    if (data.completedMap && typeof data.completedMap === "object") {
      setCompletedMap(data.completedMap);
    }
    setActiveKeys([]);
    setActiveSelected(null);
  }

  function onPanelDragStart(panelId) {
    setDraggedPanel(panelId);
  }

  function onPanelDrop(targetPanelId) {
    if (!draggedPanel || draggedPanel === targetPanelId) {
      setDraggedPanel(null);
      return;
    }
    setPanelOrder((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(draggedPanel);
      const toIdx = next.indexOf(targetPanelId);
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, draggedPanel);
      return next;
    });
    setDraggedPanel(null);
  }

  function showShortcuts() {
    modal.info({
      title: t("shortcuts"),
      content: (
        <ul>
          <li>/ - search focus</li>
          <li>Enter - search</li>
          <li>ArrowUp/ArrowDown - active selected</li>
          <li>Delete - remove active selected</li>
          <li>? - shortcut dialog</li>
        </ul>
      ),
    });
  }

  // --- Keyboard shortcuts ---
  useEffect(() => {
    function onKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (event.key === "?") {
        event.preventDefault();
        showShortcuts();
        return;
      }
      const tagName = String(event.target?.tagName || "").toLowerCase();
      if (["input", "textarea", "select"].includes(tagName)) return;
      if (event.key === "Delete" && activeSelected) {
        event.preventDefault();
        removeItem(activeSelected);
        return;
      }
      const currentIndex = selectedItems.findIndex((item) => item.uniqueName === activeSelected);
      if (event.key === "ArrowDown" && selectedItems.length > 0) {
        event.preventDefault();
        const next = currentIndex < 0 ? 0 : (currentIndex + 1) % selectedItems.length;
        setActiveSelected(selectedItems[next].uniqueName);
        setActiveKeys((prev) =>
          prev.includes(selectedItems[next].uniqueName)
            ? prev
            : [...prev, selectedItems[next].uniqueName],
        );
        return;
      }
      if (event.key === "ArrowUp" && selectedItems.length > 0) {
        event.preventDefault();
        const next = currentIndex <= 0 ? selectedItems.length - 1 : currentIndex - 1;
        setActiveSelected(selectedItems[next].uniqueName);
        setActiveKeys((prev) =>
          prev.includes(selectedItems[next].uniqueName)
            ? prev
            : [...prev, selectedItems[next].uniqueName],
        );
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeSelected, selectedItems]);

  // --- Render ---
  return (
    <>
      <div className="app-shell" role="application" aria-label="Warframe Craft Tracker">
        <Space direction="vertical" size="middle" style={{ width: "100%" }} className="hero-stack" component="main">
          <Header
            t={t}
            language={language}
            setLanguage={setLanguage}
            themeName={themeName}
            setThemeName={setThemeName}
            setCustomThemeTokens={setCustomThemeTokens}
            setThemeDrawerOpen={setThemeDrawerOpen}
            setWizardOpen={setWizardOpen}
            showShortcuts={showShortcuts}
            adjustedTotals={adjustedTotals}
            selectedItems={selectedItems}
          />

          {(() => {
            const panelRegistry = {
              search: (
                <SearchPanel
                  t={t}
                  tin={tin}
                  onAddItem={addItem}
                  searchInputRef={searchInputRef}
                />
              ),
              selected: (
                <SelectedPanel
                  t={t}
                  tin={tin}
                  selectedItems={selectedItems}
                  filteredSelectedItems={filteredSelectedItems}
                  selectedSearch={selectedSearch}
                  setSelectedSearch={setSelectedSearch}
                  selectedCategoryFilter={selectedCategoryFilter}
                  setSelectedCategoryFilter={setSelectedCategoryFilter}
                  selectedCategoryOptions={selectedCategoryOptions}
                  completionView={completionView}
                  setCompletionView={setCompletionView}
                  activeKeys={activeKeys}
                  setActiveKeys={setActiveKeys}
                  activeSelected={activeSelected}
                  setActiveSelected={setActiveSelected}
                  detailByItem={detailByItem}
                  completedMap={completedMap}
                  enrichedByItem={enrichedByItem}
                  focusRequirementKey={focusRequirementKey}
                  requirementRefs={requirementRefs}
                  focusedTotalRequirement={focusedTotalRequirement}
                  setFocusedTotalRequirement={setFocusedTotalRequirement}
                  focusRequirementKeyValue={focusRequirementKey}
                  removeItem={removeItem}
                  updateQuantity={updateQuantity}
                  setCompletedQuantity={setCompletedQuantity}
                  clearAllItems={clearAllItems}
                  onImportData={importBackupData}
                />
              ),
              totals: (
                <TotalsPanel
                  t={t}
                  tin={tin}
                  adjustedTotals={adjustedTotals}
                  loadingCalc={loadingCalc}
                  focusedTotalRequirement={focusedTotalRequirement}
                  setFocusedTotalRequirement={setFocusedTotalRequirement}
                  requirementParentMap={requirementParentMap}
                  onBulkDonate={bulkDonate}
                />
              ),
            };

            return (
              <div className="resizable-row" ref={containerRef}>
                {panelOrder.map((panelId, index) => (
                  <div key={panelId} style={{ display: "contents" }}>
                    <div
                      className={`resizable-panel ${draggedPanel === panelId ? "dragging" : ""} ${draggedPanel && draggedPanel !== panelId ? "drag-target" : ""}`}
                      style={{ width: `${panelWidths[panelId]}%` }}
                      draggable
                      onDragStart={() => onPanelDragStart(panelId)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onPanelDrop(panelId)}
                      onDragEnd={() => setDraggedPanel(null)}
                    >
                      {panelRegistry[panelId]}
                    </div>
                    {index < panelOrder.length - 1 && (
                      <div
                        className="resize-handle"
                        onMouseDown={(e) =>
                          onResizeStart(panelOrder[index], panelOrder[index + 1], e)
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </Space>

        <Footer />
      </div>

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
