import { useLocation, Link } from "react-router-dom";
import { SearchOutlined, MenuOutlined, RightOutlined, ShareAltOutlined } from "@ant-design/icons";
const WF_ICONS = "https://wiki.warframe.com/images";
import { useTranslate } from "../../hooks/useTranslate";
import { useAppStore } from "../../stores/appStore";
import LanguageSelect from "./LanguageSelect";
import AccountMenu from "./AccountMenu";
import PageHelpDrawer from "./PageHelpDrawer";

const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || navigator.platform);
const MOD_KEY = isMac ? "⌘" : "Ctrl";

export default function AppHeader() {
  const { t } = useTranslate();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const openThemeDrawer = useAppStore((s) => s.openThemeDrawer);
  const openShortcuts = useAppStore((s) => s.openShortcuts);
  const openMobileSidebar = useAppStore((s) => s.openMobileSidebar);
  const openShareModal = useAppStore((s) => s.openShareModal);

  const location = useLocation();
  const p = location.pathname;
  const pageTitle = p === "/craft" ? t("craftTracker") : p === "/relic" ? t("relicTracker") : p === "/inventory" ? t("inventoryTracker") : p === "/mastery" ? t("masteryTracker") : p === "/timers" ? t("timersTracker") : p === "/amps" ? t("ampsTracker") : p === "/activities" ? t("activitiesPage") : p === "/checklist" ? t("checklistPage") : p === "/farm" ? t("farmPlanner") : t("dashboard");
  const isDashboard = p === "/";

  return (
    <header className="app-header">
      <div className="app-header-left">
        <button className="header-hamburger" onClick={openMobileSidebar} aria-label="Menu">
          <MenuOutlined />
        </button>
        <nav className="app-header-breadcrumb">
          <Link to="/" className="breadcrumb-root">WIT</Link>
          {!isDashboard && (
            <>
              <RightOutlined className="breadcrumb-sep" />
              <span className="breadcrumb-current">{pageTitle}</span>
            </>
          )}
          {isDashboard && <span className="breadcrumb-current">{pageTitle}</span>}
        </nav>
      </div>
      <div className="app-header-right">
        <button
          className="header-shortcut-btn"
          onClick={() => {
            // Synthesize a Cmd/Ctrl+K so CommandPalette's global listener
            // fires — keeps a single source of truth for that toggle.
            const evt = new KeyboardEvent("keydown", { key: "k", metaKey: isMac, ctrlKey: !isMac, bubbles: true });
            window.dispatchEvent(evt);
          }}
          title={t("cmdPlaceholder")}
          aria-label={t("cmdPlaceholder")}
        >
          <SearchOutlined className="header-shortcut-icon" />
          <span className="header-shortcut-label">{t("search")}</span>
          <span className="header-shortcut-kbd">{MOD_KEY}K</span>
        </button>
        <PageHelpDrawer />
        <LanguageSelect
          value={language}
          onChange={setLanguage}
          compact
        />
        <button
          className="header-icon-btn"
          onClick={openShareModal}
          title={t("shareModalTitle")}
          aria-label={t("shareModalTitle")}
        >
          <ShareAltOutlined style={{ fontSize: 16, opacity: 0.85 }} />
        </button>
        <AccountMenu />
        <button
          className="header-icon-btn"
          onClick={openThemeDrawer}
          title={t("customize")}
          aria-label={t("customize")}
        >
          <img src={`${WF_ICONS}/IconSalvage%28xWhite%29.png`} alt="" style={{ width: 18, height: 18, objectFit: "contain", opacity: 0.8 }} loading="lazy" decoding="async" />
        </button>
      </div>
    </header>
  );
}
