import { useLocation } from "react-router-dom";
import { Segmented } from "antd";
import { SearchOutlined, MenuOutlined } from "@ant-design/icons";
const WF_ICONS = "https://wiki.warframe.com/images";
import { themeOptions } from "../../constants/themes";
import { useTranslate } from "../../hooks/useTranslate";
import { useAppStore } from "../../stores/appStore";

const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const CMD_KEY = isMac ? "⌘" : "Ctrl";

export default function AppHeader() {
  const { t } = useTranslate();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const themeName = useAppStore((s) => s.themeName);
  const setThemeName = useAppStore((s) => s.setThemeName);
  const setCustomThemeTokens = useAppStore((s) => s.setCustomThemeTokens);
  const openThemeDrawer = useAppStore((s) => s.openThemeDrawer);
  const openShortcuts = useAppStore((s) => s.openShortcuts);
  const openMobileSidebar = useAppStore((s) => s.openMobileSidebar);

  const location = useLocation();
  const isRelic = location.pathname === "/relic";
  const isInventory = location.pathname === "/inventory";
  const pageTitle = isInventory ? t("inventoryTracker") : isRelic ? t("relicTracker") : t("craftTracker");
  const pageDesc = isInventory ? t("inventoryTrackerDesc") : isRelic ? t("relicTrackerDesc") : t("craftTrackerDesc");

  return (
    <header className="app-header">
      <div className="app-header-left">
        <button className="header-hamburger" onClick={openMobileSidebar} aria-label="Menu">
          <MenuOutlined />
        </button>
        <div className="app-header-titles">
          <span className="app-header-title">{pageTitle}</span>
          <span className="app-header-desc">{pageDesc}</span>
        </div>
      </div>
      <div className="app-header-right">
        <button className="header-shortcut-btn" onClick={openShortcuts} title={t("shortcutsTitle")}>
          <SearchOutlined className="header-shortcut-icon" />
          <span className="header-shortcut-label">{t("search")}</span>
          <span className="header-shortcut-kbd">{CMD_KEY}K</span>
        </button>
        <Segmented
          size="small"
          value={language}
          onChange={setLanguage}
          options={[{ value: "tr", label: "TR" }, { value: "en", label: "EN" }]}
        />
        <Segmented
          size="small"
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
        <button className="header-icon-btn" onClick={openThemeDrawer}>
          <img src={`${WF_ICONS}/IconSalvage%28xWhite%29.png`} alt="" style={{ width: 18, height: 18, objectFit: "contain", opacity: 0.8 }} />
        </button>
      </div>
    </header>
  );
}
