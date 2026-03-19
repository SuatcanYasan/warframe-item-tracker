const FALLBACK_ICON =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><rect width='48' height='48' rx='8' fill='%2311182a'/><path d='M24 10l10 6v12l-10 6-10-6V16z' fill='%233f568f'/></svg>";

const UI_STORAGE_KEY = "wf-ui-v2";

const translations = {
  tr: {
    title: "Warframe Craft Tracker",
    subtitle: "Sol panelden item sec, ortada listeyi yonet, sagda toplam ana malzemeleri takip et.",
    language: "Dil",
    theme: "Tema",
    shortcuts: "Kisayollar",
    itemsList: "Item Listesi",
    selectedItems: "Secilen Itemler",
    totals: "Toplam Gerekenler",
    detail: "Detay",
    close: "Kapat",
    open: "Ac",
    searchButton: "Ara",
    searchPlaceholder: "Esya ara (orn: Akbolto)",
    add: "Ekle",
    remove: "Sil",
    clickForDetail: "Detay icin tikla",
    noResults: "Sonuc yok.",
    noSelected: "Henuz item secilmedi.",
    totalsEmpty: "Toplam ihtiyac bulunamadi.",
    detailPrompt: "Detay icin secilen iteme tikla.",
    detailMissing: "Secili item bulunamadi.",
    detailEmpty: "Bu item icin ana materyal bulunamadi.",
    detailCollapsed: "Detay kapali. Tekrar acmak icin satira tikla veya C tusuna bas.",
    markCompleted: "Tamamlandi",
    statusReady: "Hazir",
    statusSearching: "Itemlar araniyor...",
    statusFound: "{count} sonuc bulundu",
    statusAdded: "{name} listeye eklendi",
    statusRemoved: "Item listeden kaldirildi",
    statusCalculating: "Gereksinimler hesaplaniyor...",
    statusDone: "Hesaplama tamamlandi",
    statusSearchError: "Arama hatasi",
    statusCalcError: "Hesaplama hatasi",
    searchError: "Arama hatasi: {message}",
    calcError: "Hesaplama hatasi: {message}",
    chipResults: "{count} sonuc",
    chipSelected: "{count} item",
    chipTotals: "{count} kalem",
    toastHelp: "Kisayollar: / arama, Enter ara, Del sil, Oklar secim, [/] detay, C ac/kapat, T tema, L dil, ? yardim",
    toastLang: "Dil degisti: {name}",
    toastTheme: "Tema degisti: {name}",
    toastCompleted: "{name} tamamlandi olarak isaretlendi",
    toastUncompleted: "{name} tamamlandi isareti kaldirildi",
    unknown: "Bilinmiyor",
    themeOrokin: "Orokin",
    themeDrifter: "Drifter",
    themeVoid: "Void",
  },
  en: {
    title: "Warframe Craft Tracker",
    subtitle: "Pick items on the left, manage your list in the center, track total materials on the right.",
    language: "Language",
    theme: "Theme",
    shortcuts: "Shortcuts",
    itemsList: "Item List",
    selectedItems: "Selected Items",
    totals: "Total Requirements",
    detail: "Detail",
    close: "Close",
    open: "Open",
    searchButton: "Search",
    searchPlaceholder: "Search item (e.g. Akbolto)",
    add: "Add",
    remove: "Remove",
    clickForDetail: "Click for detail",
    noResults: "No results.",
    noSelected: "No items selected yet.",
    totalsEmpty: "No total requirements.",
    detailPrompt: "Click a selected item to view details.",
    detailMissing: "Selected item not found.",
    detailEmpty: "No direct material requirements for this item.",
    detailCollapsed: "Detail is collapsed. Click again or press C to open.",
    markCompleted: "Completed",
    statusReady: "Ready",
    statusSearching: "Searching items...",
    statusFound: "{count} results found",
    statusAdded: "{name} added to list",
    statusRemoved: "Item removed from list",
    statusCalculating: "Calculating requirements...",
    statusDone: "Calculation complete",
    statusSearchError: "Search error",
    statusCalcError: "Calculation error",
    searchError: "Search error: {message}",
    calcError: "Calculation error: {message}",
    chipResults: "{count} results",
    chipSelected: "{count} items",
    chipTotals: "{count} rows",
    toastHelp: "Shortcuts: / focus search, Enter search, Del remove, Arrows select, [/] detail, C toggle, T theme, L language, ? help",
    toastLang: "Language changed: {name}",
    toastTheme: "Theme changed: {name}",
    toastCompleted: "Marked as completed: {name}",
    toastUncompleted: "Removed completed mark: {name}",
    unknown: "Unknown",
    themeOrokin: "Orokin",
    themeDrifter: "Drifter",
    themeVoid: "Void",
  },
};

const themes = ["orokin", "drifter", "void"];
const languages = ["tr", "en"];

const state = {
  selectedItems: [],
  searchResults: [],
  loadingSearch: false,
  loadingCalculation: false,
  ui: {
    language: "tr",
    theme: "orokin",
    detailCollapsed: false,
    detailCarouselIndex: 0,
    completedByItem: {},
  },
  calculation: {
    perItem: [],
    totals: [],
  },
  activeSelectedUniqueName: null,
};

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const searchResultsEl = document.getElementById("searchResults");
const selectedListEl = document.getElementById("selectedList");
const totalsListEl = document.getElementById("totalsList");
const detailTitleEl = document.getElementById("detailTitle");
const detailRequirementsEl = document.getElementById("detailRequirements");
const appStatusEl = document.getElementById("appStatus");
const searchCountChipEl = document.getElementById("searchCountChip");
const selectedCountChipEl = document.getElementById("selectedCountChip");
const totalsCountChipEl = document.getElementById("totalsCountChip");
const detailPrevButton = document.getElementById("detailPrevButton");
const detailNextButton = document.getElementById("detailNextButton");
const detailToggleButton = document.getElementById("detailToggleButton");
const detailPageInfoEl = document.getElementById("detailPageInfo");
const themeSelectEl = document.getElementById("themeSelect");
const languageSelectEl = document.getElementById("languageSelect");
const shortcutButtonEl = document.getElementById("shortcutButton");
const toastContainerEl = document.getElementById("toastContainer");

const titleTextEl = document.getElementById("titleText");
const subtitleTextEl = document.getElementById("subtitleText");
const languageLabelEl = document.getElementById("languageLabel");
const themeLabelEl = document.getElementById("themeLabel");
const itemsPanelTitleEl = document.getElementById("itemsPanelTitle");
const selectedPanelTitleEl = document.getElementById("selectedPanelTitle");
const totalsPanelTitleEl = document.getElementById("totalsPanelTitle");

function makeThumb(imageUrl, alt) {
  const img = document.createElement("img");
  img.className = "thumb";
  img.loading = "lazy";
  img.alt = alt;
  img.src = imageUrl || FALLBACK_ICON;
  img.addEventListener("error", () => {
    img.src = FALLBACK_ICON;
  });
  return img;
}

function t(key, params = {}) {
  const lang = translations[state.ui.language] || translations.tr;
  const template = lang[key] || translations.tr[key] || key;

  return template.replace(/\{(\w+)\}/g, (_match, name) => {
    const value = params[name];
    return value === undefined ? "" : String(value);
  });
}

function showToast(message, type = "info", durationMs = 3200) {
  const toast = document.createElement("div");
  toast.className = `toast${type === "error" ? " error" : ""}`;
  toast.textContent = message;
  toastContainerEl.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, durationMs);
}

function loadUiState() {
  try {
    const raw = localStorage.getItem(UI_STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    if (languages.includes(parsed?.language)) {
      state.ui.language = parsed.language;
    }

    if (themes.includes(parsed?.theme)) {
      state.ui.theme = parsed.theme;
    }

    state.ui.detailCollapsed = Boolean(parsed?.detailCollapsed);
    state.ui.completedByItem = parsed?.completedByItem || {};
  } catch (_error) {
    // Ignore invalid persisted UI state.
  }
}

function saveUiState() {
  localStorage.setItem(
    UI_STORAGE_KEY,
    JSON.stringify({
      language: state.ui.language,
      theme: state.ui.theme,
      detailCollapsed: state.ui.detailCollapsed,
      completedByItem: state.ui.completedByItem,
    }),
  );
}

function applyTheme() {
  document.body.setAttribute("data-theme", state.ui.theme);
  themeSelectEl.value = state.ui.theme;
}

function themeLabel(theme) {
  if (theme === "drifter") {
    return t("themeDrifter");
  }

  if (theme === "void") {
    return t("themeVoid");
  }

  return t("themeOrokin");
}

function applyLanguage() {
  document.documentElement.lang = state.ui.language;

  titleTextEl.textContent = t("title");
  subtitleTextEl.textContent = t("subtitle");
  languageLabelEl.textContent = t("language");
  themeLabelEl.textContent = t("theme");
  shortcutButtonEl.textContent = t("shortcuts");
  itemsPanelTitleEl.textContent = t("itemsList");
  selectedPanelTitleEl.textContent = t("selectedItems");
  totalsPanelTitleEl.textContent = t("totals");
  searchButton.textContent = t("searchButton");
  searchInput.placeholder = t("searchPlaceholder");

  const options = Array.from(themeSelectEl.options);
  for (const option of options) {
    option.textContent = themeLabel(option.value);
  }

  updateDetailToggleButton();
}

function setStatus(message) {
  appStatusEl.textContent = message;
}

function setCountChips() {
  const searchCount = state.searchResults.length;
  const selectedCount = state.selectedItems.length;
  const totalsCount = (state.calculation.totals || []).length;

  searchCountChipEl.textContent = t("chipResults", { count: searchCount });
  selectedCountChipEl.textContent = t("chipSelected", { count: selectedCount });
  totalsCountChipEl.textContent = t("chipTotals", { count: totalsCount });
}

function createSkeletonBlock(count = 3) {
  const wrapper = document.createElement("div");
  for (let i = 0; i < count; i += 1) {
    const skeleton = document.createElement("div");
    skeleton.className = "skeleton";
    wrapper.appendChild(skeleton);
  }
  return wrapper;
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

function renderSearchResults() {
  searchResultsEl.innerHTML = "";

  if (state.loadingSearch) {
    searchResultsEl.appendChild(createSkeletonBlock(5));
    return;
  }

  if (state.searchResults.length === 0) {
    searchResultsEl.innerHTML = `<div class="empty-state">${t("noResults")}</div>`;
    setCountChips();
    return;
  }

  for (const item of state.searchResults) {
    const row = document.createElement("div");
    row.className = "search-result-item";

    const left = document.createElement("div");
    left.className = "item-summary";
    left.appendChild(makeThumb(item.imageUrl, item.name));

    const text = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = item.name;
    const meta = document.createElement("span");
    meta.className = "muted";
    meta.textContent = item.type || t("unknown");
    text.appendChild(title);
    text.appendChild(meta);
    left.appendChild(text);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-primary";
    button.textContent = t("add");
    button.addEventListener("click", () => addSelectedItem(item));

    row.appendChild(left);
    row.appendChild(button);
    searchResultsEl.appendChild(row);
  }

  setCountChips();
}

function setActiveItem(uniqueName) {
  if (state.activeSelectedUniqueName === uniqueName) {
    state.ui.detailCollapsed = !state.ui.detailCollapsed;
  } else {
    state.activeSelectedUniqueName = uniqueName;
    state.ui.detailCollapsed = false;
    state.ui.detailCarouselIndex = 0;
  }

  updateDetailToggleButton();
  saveUiState();
}

function renderSelectedItems() {
  selectedListEl.innerHTML = "";

  if (state.selectedItems.length === 0) {
    selectedListEl.innerHTML = `<div class="empty-state">${t("noSelected")}</div>`;
    setCountChips();
    return;
  }

  for (const item of state.selectedItems) {
    const row = document.createElement("div");
    row.className = "selected-item";
    if (state.activeSelectedUniqueName === item.uniqueName) {
      row.classList.add("active");
    }

    const main = document.createElement("div");
    main.className = "selected-item-main item-summary";
    main.addEventListener("click", () => {
      setActiveItem(item.uniqueName);
      renderSelectedItems();
      renderDetail();
    });

    main.appendChild(makeThumb(item.imageUrl, item.name));
    const text = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = item.name;
    const hint = document.createElement("span");
    hint.className = "muted";
    hint.textContent = t("clickForDetail");
    text.appendChild(title);
    text.appendChild(hint);
    main.appendChild(text);

    const controls = document.createElement("div");
    controls.className = "selected-item-controls";
    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.min = "1";
    qtyInput.value = String(item.quantity);
    qtyInput.addEventListener("change", () => {
      item.quantity = Math.max(1, Number(qtyInput.value) || 1);
      calculateAndRender();
    });
    controls.appendChild(qtyInput);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "btn btn-danger";
    removeButton.textContent = t("remove");
    removeButton.addEventListener("click", () => removeSelectedItem(item.uniqueName));

    row.appendChild(main);
    row.appendChild(controls);
    row.appendChild(removeButton);
    selectedListEl.appendChild(row);
  }

  setCountChips();
}

function renderTotals() {
  totalsListEl.innerHTML = "";
  const totals = state.calculation.totals || [];

  if (totals.length === 0) {
    totalsListEl.innerHTML = `<div class="empty-state">${t("totalsEmpty")}</div>`;
    setCountChips();
    return;
  }

  for (const resource of totals) {
    const row = document.createElement("div");
    row.className = "resource-row";

    const left = document.createElement("div");
    left.className = "item-summary";
    left.appendChild(makeThumb(resource.imageUrl, resource.name));

    const label = document.createElement("strong");
    label.textContent = resource.name;
    left.appendChild(label);

    const amount = document.createElement("strong");
    amount.textContent = String(resource.quantity);

    row.appendChild(left);
    row.appendChild(amount);
    totalsListEl.appendChild(row);
  }

  setCountChips();
}

function getActiveBreakdown() {
  return (state.calculation.perItem || []).find(
    (item) => item.uniqueName === state.activeSelectedUniqueName,
  );
}

function ensureCarouselIndex(maxLength) {
  if (maxLength <= 0) {
    state.ui.detailCarouselIndex = 0;
    return;
  }

  state.ui.detailCarouselIndex = Math.min(
    Math.max(state.ui.detailCarouselIndex, 0),
    maxLength - 1,
  );
}

function completionKey(parentUniqueName, requirementUniqueName) {
  return `${parentUniqueName}::${requirementUniqueName}`;
}

function toggleRequirementCompleted(parentUniqueName, requirement) {
  const map = state.ui.completedByItem[parentUniqueName] || {};
  const key = completionKey(parentUniqueName, requirement.uniqueName);
  const nextValue = !Boolean(map[key]);
  map[key] = nextValue;
  state.ui.completedByItem[parentUniqueName] = map;

  saveUiState();
  renderDetail();

  if (nextValue) {
    showToast(t("toastCompleted", { name: requirement.name }));
  } else {
    showToast(t("toastUncompleted", { name: requirement.name }));
  }
}

function updateDetailCarouselControls(length) {
  detailPrevButton.disabled = length <= 1;
  detailNextButton.disabled = length <= 1;
  detailPageInfoEl.textContent = length > 0
    ? `${state.ui.detailCarouselIndex + 1} / ${length}`
    : "0 / 0";
}

function updateDetailToggleButton() {
  detailToggleButton.textContent = state.ui.detailCollapsed ? t("open") : t("close");
}

function renderDetail() {
  detailRequirementsEl.innerHTML = "";
  const activeUniqueName = state.activeSelectedUniqueName;

  if (!activeUniqueName) {
    detailTitleEl.textContent = t("detail");
    detailRequirementsEl.innerHTML = `<div class="empty-state">${t("detailPrompt")}</div>`;
    updateDetailCarouselControls(0);
    return;
  }

  const selected = state.selectedItems.find((item) => item.uniqueName === activeUniqueName);
  if (!selected) {
    detailTitleEl.textContent = t("detail");
    detailRequirementsEl.innerHTML = `<div class="empty-state">${t("detailMissing")}</div>`;
    updateDetailCarouselControls(0);
    return;
  }

  detailTitleEl.textContent = `${selected.name} x${selected.quantity}`;

  if (state.ui.detailCollapsed) {
    detailRequirementsEl.innerHTML = `<div class="empty-state">${t("detailCollapsed")}</div>`;
    updateDetailCarouselControls(0);
    return;
  }

  const breakdown = getActiveBreakdown();

  if (!breakdown || !breakdown.requirements.length) {
    detailRequirementsEl.innerHTML = `<div class="empty-state">${t("detailEmpty")}</div>`;
    updateDetailCarouselControls(0);
    return;
  }

  const requirements = breakdown.requirements;
  ensureCarouselIndex(requirements.length);
  updateDetailCarouselControls(requirements.length);

  const requirement = requirements[state.ui.detailCarouselIndex];
  const parentUniqueName = selected.uniqueName;
  const completedMap = state.ui.completedByItem[parentUniqueName] || {};
  const key = completionKey(parentUniqueName, requirement.uniqueName);
  const completed = Boolean(completedMap[key]);

  const card = document.createElement("article");
  card.className = `detail-card${completed ? " completed" : ""}`;

  const left = document.createElement("div");
  left.className = "item-summary";
  left.appendChild(makeThumb(requirement.imageUrl, requirement.name));

  const text = document.createElement("div");
  const label = document.createElement("strong");
  label.textContent = requirement.name;
  const muted = document.createElement("span");
  muted.className = "muted";
  muted.textContent = `${state.ui.detailCarouselIndex + 1} / ${requirements.length}`;
  text.appendChild(label);
  text.appendChild(muted);
  left.appendChild(text);

  const meta = document.createElement("div");
  meta.className = "detail-meta";
  const amount = document.createElement("strong");
  amount.textContent = String(requirement.quantity);

  const completionLabel = document.createElement("label");
  completionLabel.className = "completion-toggle";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = completed;
  checkbox.addEventListener("change", () => {
    toggleRequirementCompleted(parentUniqueName, requirement);
  });

  const completionText = document.createElement("span");
  completionText.textContent = t("markCompleted");
  completionLabel.appendChild(checkbox);
  completionLabel.appendChild(completionText);

  meta.appendChild(amount);
  meta.appendChild(completionLabel);

  card.appendChild(left);
  card.appendChild(meta);
  detailRequirementsEl.appendChild(card);
}

function moveCarousel(step) {
  const breakdown = getActiveBreakdown();
  const requirements = breakdown?.requirements || [];
  if (!requirements.length) {
    return;
  }

  const length = requirements.length;
  const nextIndex = (state.ui.detailCarouselIndex + step + length) % length;
  state.ui.detailCarouselIndex = nextIndex;
  renderDetail();
}

async function searchItems() {
  const query = searchInput.value.trim();
  const encodedQuery = encodeURIComponent(query);

  try {
    state.loadingSearch = true;
    setStatus(t("statusSearching"));
    renderSearchResults();

    const data = await requestJson(`/api/items?search=${encodedQuery}&limit=40`);
    state.searchResults = data.items || [];
    setStatus(t("statusFound", { count: state.searchResults.length }));
    renderSearchResults();
  } catch (error) {
    searchResultsEl.innerHTML = `<div class=\"empty-state error\">${t("searchError", { message: error.message })}</div>`;
    setStatus(t("statusSearchError"));
    showToast(t("searchError", { message: error.message }), "error");
  } finally {
    state.loadingSearch = false;
    renderSearchResults();
  }
}

function addSelectedItem(item) {
  const existing = state.selectedItems.find((selected) => selected.uniqueName === item.uniqueName);

  if (existing) {
    existing.quantity += 1;
  } else {
    state.selectedItems.push({
      uniqueName: item.uniqueName,
      name: item.name,
      imageUrl: item.imageUrl || null,
      quantity: 1,
    });
  }

  if (!state.activeSelectedUniqueName) {
    state.activeSelectedUniqueName = item.uniqueName;
    state.ui.detailCollapsed = false;
  }

  setStatus(t("statusAdded", { name: item.name }));
  showToast(t("statusAdded", { name: item.name }));
  renderSelectedItems();
  calculateAndRender();
}

function removeSelectedItem(uniqueName) {
  state.selectedItems = state.selectedItems.filter((item) => item.uniqueName !== uniqueName);

  if (state.activeSelectedUniqueName === uniqueName) {
    state.activeSelectedUniqueName = state.selectedItems[0]?.uniqueName || null;
    state.ui.detailCarouselIndex = 0;
  }

  setStatus(t("statusRemoved"));
  showToast(t("statusRemoved"));
  renderSelectedItems();
  calculateAndRender();
}

async function calculateAndRender() {
  if (state.selectedItems.length === 0) {
    state.calculation = { perItem: [], totals: [] };
    renderTotals();
    renderDetail();
    return;
  }

  try {
    state.loadingCalculation = true;
    setStatus(t("statusCalculating"));

    const data = await requestJson("/api/calculate", {
      method: "POST",
      body: JSON.stringify({
        items: state.selectedItems,
        expandSubcomponents: false,
        includeBlueprints: false,
      }),
    });

    state.calculation = {
      perItem: data.perItem || [],
      totals: data.totals || [],
    };
    setStatus(t("statusDone"));
  } catch (error) {
    state.calculation = { perItem: [], totals: [] };
    totalsListEl.innerHTML = `<div class=\"empty-state error\">${t("calcError", { message: error.message })}</div>`;
    setStatus(t("statusCalcError"));
    showToast(t("calcError", { message: error.message }), "error");
  } finally {
    state.loadingCalculation = false;
  }

  renderTotals();
  renderDetail();
}

function cycleTheme() {
  const currentIndex = themes.indexOf(state.ui.theme);
  const nextIndex = (currentIndex + 1) % themes.length;
  state.ui.theme = themes[nextIndex];
  applyTheme();
  saveUiState();
  showToast(t("toastTheme", { name: themeLabel(state.ui.theme) }));
}

function cycleLanguage() {
  const currentIndex = languages.indexOf(state.ui.language);
  const nextIndex = (currentIndex + 1) % languages.length;
  state.ui.language = languages[nextIndex];
  languageSelectEl.value = state.ui.language;
  applyLanguage();
  setStatus(t("statusReady"));
  renderSearchResults();
  renderSelectedItems();
  renderTotals();
  renderDetail();
  saveUiState();
  showToast(t("toastLang", { name: state.ui.language.toUpperCase() }));
}

function isTypingTarget(target) {
  if (!target) {
    return false;
  }

  const tag = String(target.tagName || "").toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

function selectAdjacentItem(step) {
  const list = state.selectedItems;
  if (!list.length) {
    return;
  }

  const currentIndex = list.findIndex((item) => item.uniqueName === state.activeSelectedUniqueName);
  const baseIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (baseIndex + step + list.length) % list.length;
  state.activeSelectedUniqueName = list[nextIndex].uniqueName;
  state.ui.detailCollapsed = false;
  state.ui.detailCarouselIndex = 0;

  renderSelectedItems();
  renderDetail();
}

function toggleDetailCollapsed() {
  state.ui.detailCollapsed = !state.ui.detailCollapsed;
  updateDetailToggleButton();
  renderDetail();
  saveUiState();
}

function handleGlobalShortcuts(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  if (event.key === "/") {
    event.preventDefault();
    searchInput.focus();
    searchInput.select();
    return;
  }

  if (event.key === "?") {
    event.preventDefault();
    showToast(t("toastHelp"), "info", 5200);
    return;
  }

  const typing = isTypingTarget(event.target);
  if (typing && event.key !== "Escape") {
    return;
  }

  if (event.key === "Delete") {
    if (state.activeSelectedUniqueName) {
      removeSelectedItem(state.activeSelectedUniqueName);
    }
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    selectAdjacentItem(1);
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    selectAdjacentItem(-1);
    return;
  }

  if (event.key === "[") {
    event.preventDefault();
    moveCarousel(-1);
    return;
  }

  if (event.key === "]") {
    event.preventDefault();
    moveCarousel(1);
    return;
  }

  if (event.key.toLowerCase() === "c") {
    event.preventDefault();
    toggleDetailCollapsed();
    return;
  }

  if (event.key.toLowerCase() === "t") {
    event.preventDefault();
    cycleTheme();
    return;
  }

  if (event.key.toLowerCase() === "l") {
    event.preventDefault();
    cycleLanguage();
  }
}

searchButton.addEventListener("click", searchItems);
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchItems();
  }
});

detailPrevButton.addEventListener("click", () => moveCarousel(-1));
detailNextButton.addEventListener("click", () => moveCarousel(1));
detailToggleButton.addEventListener("click", () => toggleDetailCollapsed());

themeSelectEl.addEventListener("change", () => {
  state.ui.theme = themeSelectEl.value;
  applyTheme();
  saveUiState();
  showToast(t("toastTheme", { name: themeLabel(state.ui.theme) }));
});

languageSelectEl.addEventListener("change", () => {
  state.ui.language = languageSelectEl.value;
  applyLanguage();
  setStatus(t("statusReady"));
  renderSearchResults();
  renderSelectedItems();
  renderTotals();
  renderDetail();
  saveUiState();
  showToast(t("toastLang", { name: state.ui.language.toUpperCase() }));
});

shortcutButtonEl.addEventListener("click", () => {
  showToast(t("toastHelp"), "info", 5200);
});

window.addEventListener("keydown", handleGlobalShortcuts);

loadUiState();
applyTheme();
languageSelectEl.value = state.ui.language;
applyLanguage();

renderSearchResults();
renderSelectedItems();
renderTotals();
renderDetail();
setCountChips();
setStatus(t("statusReady"));
searchItems();




