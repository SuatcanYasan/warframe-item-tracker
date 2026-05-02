import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MenuOutlined,
  HomeOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Segmented } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslate } from "../../hooks/useTranslate";
import { useAppStore } from "../../stores/appStore";
import { themeOptions } from "../../constants/themes";
import LanguageSelect from "./LanguageSelect";

const WF_ICONS = "https://wiki.warframe.com/images";

const ALL_ITEMS = [
  { key: "dashboard", path: "/", icon: <HomeOutlined />, labelKey: "dashboard" },
  { key: "craft", path: "/craft", img: `${WF_ICONS}/IconCategoryModular%28xWhite%29.png`, labelKey: "craftTracker" },
  { key: "relic", path: "/relic", img: `${WF_ICONS}/IconProjectionT1%28xWhite%29.png`, labelKey: "relicTracker" },
  { key: "inventory", path: "/inventory", img: `${WF_ICONS}/IconBundle%28xWhite%29.png`, labelKey: "inventoryTracker" },
  { key: "mastery", path: "/mastery", img: `${WF_ICONS}/IconMasteryRank.png`, labelKey: "masteryTracker" },
  { key: "timers", path: "/timers", img: `${WF_ICONS}/IconTimer%28xWhite%29.png`, labelKey: "timersTracker" },
  { key: "amps", path: "/amps", img: `${WF_ICONS}/IconCategoryAmp%28xWhite%29.png`, labelKey: "ampsTracker" },
  { key: "activities", path: "/activities", img: `${WF_ICONS}/IconAllyDown%28xRed%29.png`, labelKey: "activitiesPage" },
  { key: "checklist", path: "/checklist", img: `${WF_ICONS}/IconQuest%28xWhite%29.png`, labelKey: "checklistPage" },
  { key: "farm", path: "/farm", img: `${WF_ICONS}/IconMissionMarkerLoot%28xWhite%29.png`, labelKey: "farmPlanner" },
  { key: "arcanes", path: "/arcanes", img: `${WF_ICONS}/Arcane.png`, labelKey: "arcTitle" },
];

const LEFT_ITEMS = [ALL_ITEMS[0], ALL_ITEMS[1]];
const RIGHT_ITEMS = [ALL_ITEMS[2], ALL_ITEMS[3]];

function NavItem({ item, active, onClick, t }) {
  return (
    <button
      className={`mobile-nav-item ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <span className="mobile-nav-icon">
        {item.img ? <img src={item.img} alt="" loading="lazy" decoding="async" /> : item.icon}
      </span>
      <span className="mobile-nav-label">{t(item.labelKey)}</span>
    </button>
  );
}

export default function MobileNav() {
  const { t } = useTranslate();
  const navigate = useNavigate();
  const location = useLocation();
  const openThemeDrawer = useAppStore((s) => s.openThemeDrawer);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const themeName = useAppStore((s) => s.themeName);
  const setThemeName = useAppStore((s) => s.setThemeName);
  const setCustomThemeTokens = useAppStore((s) => s.setCustomThemeTokens);
  const [sheetOpen, setSheetOpen] = useState(false);

  const currentPath = location.pathname;

  const go = (path) => {
    navigate(path);
    setSheetOpen(false);
  };

  const openSettings = () => {
    openThemeDrawer();
    setSheetOpen(false);
  };

  return (
    <>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <div className="mobile-nav-side">
          {LEFT_ITEMS.map((item) => (
            <NavItem
              key={item.key}
              item={item}
              active={currentPath === item.path}
              onClick={() => go(item.path)}
              t={t}
            />
          ))}
        </div>

        <div className="mobile-nav-notch">
          <button
            className={`mobile-nav-fab ${sheetOpen ? "open" : ""}`}
            onClick={() => setSheetOpen((v) => !v)}
            aria-label="Open menu"
          >
            <MenuOutlined />
          </button>
        </div>

        <div className="mobile-nav-side">
          {RIGHT_ITEMS.map((item) => (
            <NavItem
              key={item.key}
              item={item}
              active={currentPath === item.path}
              onClick={() => go(item.path)}
              t={t}
            />
          ))}
        </div>
      </nav>

      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              key="backdrop"
              className="mobile-nav-backdrop"
              onClick={() => setSheetOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              key="sheet"
              className="mobile-nav-sheet"
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              exit={{ y: "110%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 500) {
                  setSheetOpen(false);
                }
              }}
            >
              <div className="mobile-nav-sheet-handle" />
              <div className="mobile-nav-sheet-title">{t("menu")}</div>
              <div className="mobile-nav-sheet-grid">
                {ALL_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    className={`mobile-nav-sheet-item ${currentPath === item.path ? "active" : ""}`}
                    onClick={() => go(item.path)}
                  >
                    <span className="mobile-nav-sheet-icon">
                      {item.img ? <img src={item.img} alt="" loading="lazy" decoding="async" /> : item.icon}
                    </span>
                    <span className="mobile-nav-sheet-label">{t(item.labelKey)}</span>
                  </button>
                ))}
                <button className="mobile-nav-sheet-item" onClick={openSettings}>
                  <span className="mobile-nav-sheet-icon">
                    <SettingOutlined />
                  </span>
                  <span className="mobile-nav-sheet-label">{t("settings")}</span>
                </button>
              </div>

              <div className="mobile-nav-sheet-quick">
                <div className="mobile-nav-sheet-quick-row">
                  <span className="mobile-nav-sheet-quick-label">{t("language")}</span>
                  <LanguageSelect value={language} onChange={setLanguage} compact />
                </div>
                <div className="mobile-nav-sheet-quick-row">
                  <span className="mobile-nav-sheet-quick-label">{t("theme")}</span>
                  <Segmented
                    size="small"
                    value={themeName}
                    onChange={(value) => {
                      setThemeName(value);
                      setCustomThemeTokens(themeOptions[value].token);
                    }}
                    options={Object.entries(themeOptions).map(([value, opt]) => ({ value, label: opt.label }))}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
