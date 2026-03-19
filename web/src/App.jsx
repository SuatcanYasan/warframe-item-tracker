import { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  ColorPicker,
  Collapse,
  ConfigProvider,
  Divider,
  Drawer,
  Empty,
  Flex,
  Input,
  InputNumber,
  List,
  Modal,
  Progress,
  Row,
  Select,
  Segmented,
  Space,
  Spin,
  Tag,
  Typography,
  message,
  theme,
} from "antd";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  GlobalOutlined,
  SearchOutlined,
  SkinOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const STORAGE_KEY = "wf-react-ui-v2";
const FALLBACK_ICON =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><rect width='48' height='48' rx='8' fill='%2311182a'/><path d='M24 10l10 6v12l-10 6-10-6V16z' fill='%233f568f'/></svg>";

const i18n = {
  tr: {
    subtitle: "Esyalari ekle, dogrudan tarifleri takip et, tamamladikca toplamdan dus.",
    searchPlaceholder: "Esya ara (orn: Akbolto)",
    search: "Ara",
    add: "Ekle",
    remove: "Sil",
    selected: "Secilenler",
    items: "Item Listesi",
    totals: "Toplam Gerekenler",
    detail: "Detay",
    quantity: "Adet",
    completed: "Tamamlandi",
    completeTag: "Tamamlandi",
    partialTag: "Kismi",
    remaining: "Kalan",
    doneAmount: "Tamamlanan",
    completionMode: "Gorunum",
    completionAll: "Tum",
    completionOpen: "Eksik",
    completionDone: "Tamam",
    customize: "Tema Editoru",
    customPrimary: "Ana Renk",
    customBgBase: "Arkaplan",
    customBgContainer: "Panel Arkaplani",
    customText: "Metin",
    customTextSecondary: "Yardimci Metin",
    customBorder: "Kenar",
    customScrollbar: "Scroll Rengi",
    customSuccess: "Basari",
    customWarning: "Uyari",
    customError: "Hata",
    customRadius: "Kose Yuvarlaklik",
    resetTheme: "Preseti Sifirla",
    saveThemeProfile: "Temayi Kaydet",
    loadThemeProfile: "Tema Yukle",
    themeProfileName: "Profil Adi",
    themeProfilePlaceholder: "orn: Gece Mavisi",
    themeSaved: "Tema profili kaydedildi",
    themeLoaded: "Tema profili yuklendi",
    themeProfileRequired: "Profil adini gir",
    themeProfileEmpty: "Kayitli profil yok",
    exportTheme: "Tema Disari Aktar",
    importTheme: "Tema Ice Aktar",
    invalidThemeFile: "Tema dosyasi gecersiz",
    wizardTitle: "Ilk Acilis Sihirbazi",
    wizardBody: "Dil ve tema secimini bir kez yap, sonra direkt kullanmaya basla.",
    wizardOpen: "Sihirbazi Ac",
    wizardFinish: "Tamamla",
    focusHint: "Ilk eksik kaleme otomatik odaklandi",
    noResults: "Sonuc yok",
    noSelected: "Secim yok",
    noDetail: "Secilen itemin gereksinimi yok",
    shortcuts: "Kisayollar",
    language: "Dil",
    theme: "Tema",
    statusReady: "Hazir",
    unknown: "Bilinmiyor",
    resultCount: "{count} sonuc",
    selectedCount: "{count} secili",
    totalCount: "{count} kalem",
  },
  en: {
    subtitle: "Add items, track direct recipes, and subtract completed parts from totals.",
    searchPlaceholder: "Search item (e.g. Akbolto)",
    search: "Search",
    add: "Add",
    remove: "Remove",
    selected: "Selected",
    items: "Item List",
    totals: "Total Requirements",
    detail: "Detail",
    quantity: "Qty",
    completed: "Completed",
    completeTag: "Completed",
    partialTag: "Partial",
    remaining: "Remaining",
    doneAmount: "Completed",
    completionMode: "View",
    completionAll: "All",
    completionOpen: "Open",
    completionDone: "Done",
    customize: "Theme Editor",
    customPrimary: "Primary",
    customBgBase: "Background",
    customBgContainer: "Panel Background",
    customText: "Text",
    customTextSecondary: "Secondary Text",
    customBorder: "Border",
    customScrollbar: "Scrollbar",
    customSuccess: "Success",
    customWarning: "Warning",
    customError: "Error",
    customRadius: "Border Radius",
    resetTheme: "Reset To Preset",
    saveThemeProfile: "Save Theme",
    loadThemeProfile: "Load Theme",
    themeProfileName: "Profile Name",
    themeProfilePlaceholder: "e.g. Deep Blue",
    themeSaved: "Theme profile saved",
    themeLoaded: "Theme profile loaded",
    themeProfileRequired: "Enter profile name",
    themeProfileEmpty: "No saved profile",
    exportTheme: "Export Theme",
    importTheme: "Import Theme",
    invalidThemeFile: "Theme file is invalid",
    wizardTitle: "First Run Wizard",
    wizardBody: "Pick language and theme once, then start tracking immediately.",
    wizardOpen: "Open Wizard",
    wizardFinish: "Finish",
    focusHint: "Auto-focused the first missing requirement",
    noResults: "No results",
    noSelected: "No selection",
    noDetail: "No requirements for selected item",
    shortcuts: "Shortcuts",
    language: "Language",
    theme: "Theme",
    statusReady: "Ready",
    unknown: "Unknown",
    resultCount: "{count} results",
    selectedCount: "{count} selected",
    totalCount: "{count} rows",
  },
};

const themeOptions = {
  orokin: {
    label: "Orokin",
    algorithm: theme.darkAlgorithm,
    token: {
      colorPrimary: "#6e8bff",
      colorSuccess: "#4fcf8d",
      colorWarning: "#f4be5e",
      colorError: "#ff6b81",
      colorBgBase: "#0b1220",
      colorBgContainer: "#111b34",
      colorBgElevated: "#152344",
      colorText: "#eaf0ff",
      colorTextSecondary: "#9db2da",
      colorBorder: "#2f4774",
      colorScrollbar: "#4c68a4",
      borderRadius: 12,
    },
  },
  drifter: {
    label: "Drifter",
    algorithm: theme.darkAlgorithm,
    token: {
      colorPrimary: "#d38d58",
      colorSuccess: "#65d59a",
      colorWarning: "#ffbc68",
      colorError: "#ff7f7f",
      colorBgBase: "#16100d",
      colorBgContainer: "#241913",
      colorBgElevated: "#2e2018",
      colorText: "#fdebd9",
      colorTextSecondary: "#c8b09b",
      colorBorder: "#57402f",
      colorScrollbar: "#7a5b42",
      borderRadius: 10,
    },
  },
  lotus: {
    label: "Lotus",
    algorithm: theme.defaultAlgorithm,
    token: {
      colorPrimary: "#2f54eb",
      colorSuccess: "#33a96f",
      colorWarning: "#d9922e",
      colorError: "#d9534f",
      colorBgBase: "#eef3ff",
      colorBgContainer: "#ffffff",
      colorBgElevated: "#f8faff",
      colorText: "#10244f",
      colorTextSecondary: "#4f6597",
      colorBorder: "#bfd0f9",
      colorScrollbar: "#8ca8e8",
      borderRadius: 12,
    },
  },
};

const colorFields = [
  ["colorPrimary", "customPrimary"],
  ["colorBgBase", "customBgBase"],
  ["colorBgContainer", "customBgContainer"],
  ["colorText", "customText"],
  ["colorTextSecondary", "customTextSecondary"],
  ["colorBorder", "customBorder"],
  ["colorScrollbar", "customScrollbar"],
  ["colorSuccess", "customSuccess"],
  ["colorWarning", "customWarning"],
  ["colorError", "customError"],
];

function translate(language, key, params = {}) {
  const template = i18n[language]?.[key] ?? i18n.tr[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_s, token) => String(params[token] ?? ""));
}

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function createDefaultPersistedState() {
  return {
    language: "tr",
    theme: "orokin",
    customThemeTokens: themeOptions.orokin.token,
    themeProfiles: {},
    completionView: "all",
    selectedItems: [],
    activeKeys: [],
    completedMap: {},
    activeSelected: null,
    onboardingDone: false,
  };
}

function normalizePersistedState(raw) {
  const fallback = createDefaultPersistedState();
  const next = { ...(raw || {}) };
  const normalizedThemeName = themeOptions[next.theme] ? next.theme : "orokin";
  const baseThemeToken = themeOptions[normalizedThemeName].token;
  const persistedToken =
    next.customThemeTokens && typeof next.customThemeTokens === "object" ? next.customThemeTokens : {};

  return {
    ...fallback,
    ...next,
    language: next.language === "en" ? "en" : "tr",
    theme: normalizedThemeName,
    customThemeTokens: {
      ...baseThemeToken,
      ...persistedToken,
    },
    completionView: ["all", "open", "done"].includes(next.completionView)
      ? next.completionView
      : "all",
    selectedItems: Array.isArray(next.selectedItems) ? next.selectedItems : [],
    activeKeys: Array.isArray(next.activeKeys) ? next.activeKeys : [],
    themeProfiles:
      next.themeProfiles && typeof next.themeProfiles === "object" ? next.themeProfiles : {},
    completedMap: next.completedMap && typeof next.completedMap === "object" ? next.completedMap : {},
  };
}

async function getPersistedState() {
  if (window.wfDesktop?.storage?.get) {
    try {
      const fromDesktop = await window.wfDesktop.storage.get();
      return normalizePersistedState(fromDesktop);
    } catch {
      return normalizePersistedState(readStorage());
    }
  }

  return normalizePersistedState(readStorage());
}

async function savePersistedState(payload) {
  if (window.wfDesktop?.storage?.set) {
    try {
      await window.wfDesktop.storage.set(payload);
      return;
    } catch {
      // Fallback to localStorage when desktop save fails.
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

function makeRequirementKey(parentUniqueName, requirementUniqueName) {
  return `${parentUniqueName}::${requirementUniqueName}`;
}

function enrichRequirements(requirements, completedByRequirement, viewMode) {
  const enriched = (requirements || []).map((requirement) => {
    const completedQuantity = Math.min(
      requirement.quantity,
      Math.max(0, Number(completedByRequirement?.[requirement.uniqueName]) || 0),
    );

    const remainingQuantity = Math.max(0, requirement.quantity - completedQuantity);
    return {
      ...requirement,
      completedQuantity,
      remainingQuantity,
      isDone: remainingQuantity === 0,
      completionPercent:
        requirement.quantity > 0
          ? Math.round((completedQuantity / requirement.quantity) * 100)
          : 100,
    };
  });

  const sorted = enriched.sort((a, b) => {
    if (a.isDone !== b.isDone) {
      return a.isDone ? 1 : -1;
    }
    return a.name.localeCompare(b.name);
  });

  return sorted.filter((entry) => {
    if (viewMode === "open") {
      return !entry.isDone;
    }
    if (viewMode === "done") {
      return entry.isDone;
    }
    return true;
  });
}

function CraftApp() {
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

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItems, setSelectedItems] = useState(initialPersisted.selectedItems);
  const [activeKeys, setActiveKeys] = useState(initialPersisted.activeKeys);
  const [activeSelected, setActiveSelected] = useState(initialPersisted.activeSelected);
  const [completionView, setCompletionView] = useState(initialPersisted.completionView);

  const [completedMap, setCompletedMap] = useState(initialPersisted.completedMap);
  const [calculation, setCalculation] = useState({ perItem: [], totals: [] });
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingCalc, setLoadingCalc] = useState(false);
  const [focusRequirementKey, setFocusRequirementKey] = useState(null);

  const searchInputRef = useRef(null);
  const themeImportInputRef = useRef(null);
  const requirementRefs = useRef(new Map());
  const t = (key, params) => translate(language, key, params);

  useEffect(() => {
    if (isHydrated) {
      return undefined;
    }

    let cancelled = false;

    getPersistedState().then((persistedState) => {
      if (cancelled) {
        return;
      }

      setLanguage(persistedState.language);
      setThemeName(persistedState.theme);
      setCustomThemeTokens(persistedState.customThemeTokens);
      setThemeProfiles(persistedState.themeProfiles);
      setCompletionView(persistedState.completionView);
      setSelectedItems(persistedState.selectedItems);
      setActiveKeys(persistedState.activeKeys);
      setCompletedMap(persistedState.completedMap);
      setActiveSelected(persistedState.activeSelected || null);
      setWizardOpen(!persistedState.onboardingDone);
      setIsHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    savePersistedState({
        language,
        theme: themeName,
        customThemeTokens,
        themeProfiles,
        completionView,
        selectedItems,
        activeKeys,
        completedMap,
        activeSelected,
        onboardingDone: !wizardOpen,
    });
  }, [
    isHydrated,
    language,
    themeName,
    customThemeTokens,
    themeProfiles,
    completionView,
    selectedItems,
    activeKeys,
    completedMap,
    activeSelected,
    wizardOpen,
  ]);

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
          setCalculation({
            perItem: data.perItem || [],
            totals: data.totals || [],
          });
        }
      } catch (error) {
        if (!cancelled) {
          message.error(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingCalc(false);
        }
      }
    }

    calculate();
    return () => {
      cancelled = true;
    };
  }, [selectedItems]);

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

      return {
        ...total,
        remaining,
        completedAmount,
        completionPercent,
        status,
      };
    });
  }, [calculation.totals, completedMap, detailByItem, selectedItems]);

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
      if (targetNode) {
        targetNode.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    });
  }, [activeSelected, activeKeys, enrichedByItem]);

  async function runSearch(query = search) {
    const normalized = query.trim();
    setLoadingSearch(true);
    try {
      const data = await requestJson(`/api/items?search=${encodeURIComponent(normalized)}&limit=40`);
      setSearchResults(data.items || []);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoadingSearch(false);
    }
  }

  function addItem(item) {
    setSelectedItems((prev) => {
      const existing = prev.find((entry) => entry.uniqueName === item.uniqueName);
      if (existing) {
        return prev.map((entry) =>
          entry.uniqueName === item.uniqueName
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry,
        );
      }

      return [
        ...prev,
        {
          uniqueName: item.uniqueName,
          name: item.name,
          imageUrl: item.imageUrl || null,
          quantity: 1,
        },
      ];
    });

    setActiveSelected(item.uniqueName);
    setActiveKeys((prev) => (prev.includes(item.uniqueName) ? prev : [...prev, item.uniqueName]));
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
    if (activeSelected === uniqueName) {
      setActiveSelected(null);
    }
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

  function updateThemeToken(key, value) {
    setCustomThemeTokens((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetThemeToPreset() {
    setCustomThemeTokens(themeOptions[themeName].token);
  }

  function saveCurrentThemeProfile() {
    const trimmedName = themeProfileInput.trim();
    if (!trimmedName) {
      message.warning(t("themeProfileRequired"));
      return;
    }

    setThemeProfiles((prev) => ({
      ...prev,
      [trimmedName]: {
        themeName,
        token: customThemeTokens,
      },
    }));
    setSelectedProfileName(trimmedName);
    setThemeProfileInput("");
    message.success(t("themeSaved"));
  }

  function loadThemeProfile(profileName) {
    const profile = themeProfiles[profileName];
    if (!profile) {
      return;
    }

    setThemeName(profile.themeName);
    setCustomThemeTokens(profile.token);
    setSelectedProfileName(profileName);
    message.success(t("themeLoaded"));
  }

  function removeThemeProfile(profileName) {
    setThemeProfiles((prev) => {
      const next = { ...prev };
      delete next[profileName];
      return next;
    });

    if (selectedProfileName === profileName) {
      setSelectedProfileName("");
    }
  }

  function exportCurrentTheme() {
    const payload = {
      themeName,
      token: customThemeTokens,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wf-theme-${themeName}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importThemeFromFile(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        if (!parsed?.token) {
          throw new Error("invalid");
        }

        if (themeOptions[parsed.themeName]) {
          setThemeName(parsed.themeName);
        }
        setCustomThemeTokens(parsed.token);
        message.success(t("themeLoaded"));
      } catch {
        message.error(t("invalidThemeFile"));
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function finishWizard() {
    setWizardOpen(false);
    message.success(t("wizardFinish"));
  }

  function showShortcuts() {
    Modal.info({
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


  useEffect(() => {
    function onKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

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
      if (["input", "textarea", "select"].includes(tagName)) {
        return;
      }

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

  const selectedCollapseItems = selectedItems.map((item) => {
    const requirements = detailByItem.get(item.uniqueName) || [];
    const rows = enrichRequirements(requirements, completedMap[item.uniqueName] || {}, completionView);
    const isActive = activeSelected === item.uniqueName;

    return {
      key: item.uniqueName,
      label: (
        <Flex
          align="center"
          justify="space-between"
          gap={8}
          className={isActive ? "collapse-label active" : "collapse-label"}
        >
          <Space align="center">
            <img src={item.imageUrl || FALLBACK_ICON} alt={item.name} className="item-thumb" />
            <span>{item.name}</span>
          </Space>
          <Space>
            <InputNumber
              min={1}
              size="small"
              value={item.quantity}
              onClick={(event) => event.stopPropagation()}
              onChange={(value) => updateQuantity(item.uniqueName, value)}
            />
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                removeItem(item.uniqueName);
              }}
            >
              {t("remove")}
            </Button>
          </Space>
        </Flex>
      ),
      children:
        requirements.length === 0 ? (
          <Empty description={t("noDetail")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : rows.length === 0 ? (
          <Empty description={t("noResults")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            dataSource={rows}
            className="inner-scroll"
            renderItem={(requirement) => {
              const requirementKey = makeRequirementKey(item.uniqueName, requirement.uniqueName);
              return (
                <List.Item
                  className={focusRequirementKey === requirementKey ? "focus-row" : ""}
                  ref={(node) => {
                    if (node) {
                      requirementRefs.current.set(requirementKey, node);
                    } else {
                      requirementRefs.current.delete(requirementKey);
                    }
                  }}
                  actions={[
                    <Space key="right" direction="vertical" size={2} align="end">
                      <InputNumber
                        min={0}
                        max={requirement.quantity}
                        size="small"
                        value={requirement.completedQuantity}
                        onChange={(value) => setCompletedQuantity(item.uniqueName, requirement, value)}
                      />
                      <Text type={requirement.isDone ? "success" : "secondary"}>
                        {t("remaining")}: {requirement.remainingQuantity}
                      </Text>
                    </Space>,
                  ]}
                >
                  <Space direction="vertical" style={{ width: "100%" }} size={4}>
                    <Space>
                      <img
                        src={requirement.imageUrl || FALLBACK_ICON}
                        alt={requirement.name}
                        className="item-thumb"
                      />
                      <Text delete={requirement.isDone}>{requirement.name}</Text>
                      {requirement.isDone ? <Tag color="success">{t("completed")}</Tag> : null}
                    </Space>
                    <Progress
                      percent={requirement.completionPercent}
                      size="small"
                      status={requirement.isDone ? "success" : "active"}
                      format={() => `${requirement.completedQuantity} / ${requirement.quantity}`}
                    />
                  </Space>
                </List.Item>
              );
            }}
          />
        ),
      extra: isActive ? <Tag color="processing">{t("detail")}</Tag> : null,
    };
  });

  return (
    <ConfigProvider
      theme={{
        algorithm: themeOptions[themeName].algorithm,
        token: customThemeTokens,
      }}
    >
      <div className="app-shell">
        <Space direction="vertical" size="middle" style={{ width: "100%" }} className="hero-stack">
          <Card className="hero-card" variant="borderless">
            <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  Warframe Craft Tracker
                </Title>
                <Text type="secondary">{t("subtitle")}</Text>
              </div>

              <Space wrap>
                <Tag icon={<GlobalOutlined />}>{t("language")}</Tag>
                <Segmented
                  value={language}
                  onChange={(value) => setLanguage(value)}
                  options={[
                    { value: "tr", label: "TR" },
                    { value: "en", label: "EN" },
                  ]}
                />

                <Tag icon={<SkinOutlined />}>{t("theme")}</Tag>
                <Segmented
                  value={themeName}
                  onChange={(value) => {
                    setThemeName(value);
                    setCustomThemeTokens(themeOptions[value].token);
                  }}
                  options={Object.entries(themeOptions).map(([value, opt]) => ({
                    value,
                    label: opt.label,
                  }))}
                />

                <Divider type="vertical" />

                <Button onClick={() => setThemeDrawerOpen(true)}>{t("customize")}</Button>
                <Button onClick={() => setWizardOpen(true)}>{t("wizardOpen")}</Button>
                <Button onClick={showShortcuts}>{t("shortcuts")}</Button>
              </Space>
            </Flex>
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <Card
                title={`${t("items")} - ${t("resultCount", { count: searchResults.length })}`}
                className="panel-card"
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Input
                    ref={searchInputRef}
                    placeholder={t("searchPlaceholder")}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onPressEnter={() => runSearch(search)}
                    suffix={<SearchOutlined />}
                  />
                  <Button type="primary" onClick={() => runSearch(search)} icon={<SearchOutlined />}>
                    {t("search")}
                  </Button>

                  <Spin spinning={loadingSearch}>
                    <List
                      className="panel-list"
                      dataSource={searchResults}
                      locale={{ emptyText: t("noResults") }}
                      renderItem={(item) => (
                        <List.Item
                          actions={[
                            <Button key="add" type="primary" size="small" onClick={() => addItem(item)}>
                              {t("add")}
                            </Button>,
                          ]}
                        >
                          <List.Item.Meta
                            avatar={
                              <img src={item.imageUrl || FALLBACK_ICON} alt={item.name} className="item-thumb" />
                            }
                            title={item.name}
                            description={item.type || t("unknown")}
                          />
                        </List.Item>
                      )}
                    />
                  </Spin>
                </Space>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                title={
                  <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                    <span>{`${t("selected")} - ${t("selectedCount", { count: selectedItems.length })}`}</span>
                    <Space size={6}>
                      <Text type="secondary">{t("completionMode")}</Text>
                      <Segmented
                        size="small"
                        value={completionView}
                        onChange={(value) => setCompletionView(value)}
                        options={[
                          { label: t("completionAll"), value: "all" },
                          { label: t("completionOpen"), value: "open" },
                          { label: t("completionDone"), value: "done" },
                        ]}
                      />
                    </Space>
                  </Flex>
                }
                className="panel-card"
              >
                <Flex vertical gap={8} className="panel-content">
                  {focusRequirementKey ? <Text type="secondary">{t("focusHint")}</Text> : null}
                  <div className="panel-scroll">
                    {selectedItems.length === 0 ? (
                      <Empty description={t("noSelected")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    ) : (
                      <Collapse
                        className="panel-list"
                        activeKey={activeKeys}
                        onChange={(keys) => {
                          const keyList = Array.isArray(keys) ? keys : [keys];
                          setActiveKeys(keyList);
                          if (keyList.length > 0) {
                            setActiveSelected(keyList[keyList.length - 1]);
                          }
                        }}
                        items={selectedCollapseItems}
                      />
                    )}
                  </div>
                </Flex>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                title={`${t("totals")} - ${t("totalCount", { count: adjustedTotals.length })}`}
                className="panel-card"
              >
                <div className="panel-content">
                  <div className="panel-scroll">
                    <Spin spinning={loadingCalc}>
                      <List
                        className="panel-list"
                        dataSource={adjustedTotals}
                        locale={{ emptyText: t("statusReady") }}
                        renderItem={(resource) => (
                          <List.Item
                            actions={[
                              resource.status === "done" ? (
                                <Badge key="done" status="success" text={t("completeTag")} />
                              ) : resource.status === "partial" ? (
                                <Badge key="partial" status="processing" text={t("partialTag")} />
                              ) : (
                                <Text key="remaining" strong>
                                  {resource.remaining}
                                </Text>
                              ),
                            ]}
                          >
                            <List.Item.Meta
                              avatar={
                                <img
                                  src={resource.imageUrl || FALLBACK_ICON}
                                  alt={resource.name}
                                  className="item-thumb"
                                />
                              }
                              title={resource.name}
                              description={
                                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                                  <Text type="secondary">
                                    {`${t("quantity")}: ${resource.quantity} | ${t("doneAmount")}: ${resource.completedAmount} | ${t("remaining")}: ${resource.remaining}`}
                                  </Text>
                                  <Progress
                                    percent={resource.completionPercent}
                                    size="small"
                                    status={resource.status === "done" ? "success" : "active"}
                                  />
                                </Space>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </Spin>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Space>
      </div>

      <Drawer
        title={t("customize")}
        placement="right"
        width={360}
        open={themeDrawerOpen}
        onClose={() => setThemeDrawerOpen(false)}
        extra={<Button onClick={resetThemeToPreset}>{t("resetTheme")}</Button>}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Text strong>{t("loadThemeProfile")}</Text>
          <Flex gap={8} align="center">
            <Select
              style={{ flex: 1 }}
              value={selectedProfileName || undefined}
              placeholder={t("themeProfileEmpty")}
              options={Object.keys(themeProfiles).map((name) => ({
                label: name,
                value: name,
              }))}
              onChange={(value) => {
                setSelectedProfileName(value);
                loadThemeProfile(value);
              }}
            />
            <Button
              danger
              disabled={!selectedProfileName}
              onClick={() => removeThemeProfile(selectedProfileName)}
            >
              {t("remove")}
            </Button>
          </Flex>

          <Text strong>{t("saveThemeProfile")}</Text>
          <Flex gap={8} align="center">
            <Input
              value={themeProfileInput}
              placeholder={t("themeProfilePlaceholder")}
              onChange={(event) => setThemeProfileInput(event.target.value)}
            />
            <Button type="primary" onClick={saveCurrentThemeProfile}>
              {t("saveThemeProfile")}
            </Button>
          </Flex>

          <Space>
            <Button onClick={exportCurrentTheme}>{t("exportTheme")}</Button>
            <Button
              onClick={() => {
                themeImportInputRef.current?.click();
              }}
            >
              {t("importTheme")}
            </Button>
            <input
              ref={themeImportInputRef}
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={importThemeFromFile}
            />
          </Space>

          <Divider />

          {colorFields.map(([tokenKey, labelKey]) => (
            <Flex key={tokenKey} align="center" justify="space-between">
              <Text>{t(labelKey)}</Text>
              <ColorPicker
                value={customThemeTokens[tokenKey]}
                onChange={(value) => updateThemeToken(tokenKey, value.toHexString())}
                showText
              />
            </Flex>
          ))}

          <Divider />
          <Flex align="center" justify="space-between" gap={8}>
            <Text>{t("customRadius")}</Text>
            <InputNumber
              min={2}
              max={24}
              value={customThemeTokens.borderRadius}
              onChange={(value) => updateThemeToken("borderRadius", Math.max(2, Number(value) || 2))}
            />
          </Flex>
        </Space>
      </Drawer>

      <Modal
        title={t("wizardTitle")}
        open={wizardOpen}
        onCancel={finishWizard}
        onOk={finishWizard}
        okText={t("wizardFinish")}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Text>{t("wizardBody")}</Text>
          <Flex align="center" justify="space-between" wrap="wrap" gap={10}>
            <Text>{t("language")}</Text>
            <Segmented
              value={language}
              onChange={(value) => setLanguage(value)}
              options={[
                { value: "tr", label: "TR" },
                { value: "en", label: "EN" },
              ]}
            />
          </Flex>
          <Flex align="center" justify="space-between" wrap="wrap" gap={10}>
            <Text>{t("theme")}</Text>
            <Segmented
              value={themeName}
              onChange={(value) => {
                setThemeName(value);
                setCustomThemeTokens(themeOptions[value].token);
              }}
              options={Object.entries(themeOptions).map(([value, option]) => ({
                value,
                label: option.label,
              }))}
            />
          </Flex>
        </Space>
      </Modal>
    </ConfigProvider>
  );
}

export default CraftApp;


