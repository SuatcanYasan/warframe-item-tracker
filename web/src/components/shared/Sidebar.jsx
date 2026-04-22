import { useNavigate, useLocation } from "react-router-dom";
import { LeftOutlined } from "@ant-design/icons";
// All nav icons from https://wiki.warframe.com/w/Text_Icons
import { motion } from "framer-motion";
import { useTranslate } from "../../hooks/useTranslate";
import { useAppStore } from "../../stores/appStore";
import { hideImgOnError } from "../../utils/helpers";

const WF_ICONS = "https://wiki.warframe.com/images";

export default function Sidebar({ onOpenSettings }) {
  const { t } = useTranslate();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const mobileOpen = useAppStore((s) => s.mobileSidebarOpen);
  const closeMobileSidebar = useAppStore((s) => s.closeMobileSidebar);
  const navigate = useNavigate();
  const location = useLocation();
  const activePage = location.pathname === "/craft" ? "craft" : location.pathname === "/relic" ? "relic" : location.pathname === "/inventory" ? "inventory" : location.pathname === "/mastery" ? "mastery" : location.pathname === "/timers" ? "timers" : location.pathname === "/amps" ? "amps" : location.pathname === "/activities" ? "activities" : location.pathname === "/checklist" ? "checklist" : location.pathname === "/farm" ? "farm" : "dashboard";

  function handleNavClick(path) {
    navigate(path);
    closeMobileSidebar();
  }

  const navItems = [
    { key: "dashboard", path: "/", icon: <img src="/trackerlogo.png" alt="" className="nav-item-img" loading="lazy" decoding="async" />, label: t("dashboard") },
    { key: "craft", path: "/craft", icon: <img src={`${WF_ICONS}/IconCategoryModular%28xWhite%29.png`} alt="" className="nav-item-img" loading="lazy" decoding="async" />, label: t("craftTracker") },
    { key: "relic", path: "/relic", icon: <img src={`${WF_ICONS}/IconProjectionT1%28xWhite%29.png`} alt="" className="nav-item-img" loading="lazy" decoding="async" />, label: t("relicTracker") },
    { key: "inventory", path: "/inventory", icon: <img src={`${WF_ICONS}/IconBundle%28xWhite%29.png`} alt="" className="nav-item-img" loading="lazy" decoding="async" />, label: t("inventoryTracker") },
    { key: "mastery", path: "/mastery", icon: <img src={`${WF_ICONS}/IconMasteryRank.png`} alt="" className="nav-item-img" loading="lazy" decoding="async" />, label: t("masteryTracker") },
    { key: "amps", path: "/amps", icon: <img src={`${WF_ICONS}/IconCategoryAmp%28xWhite%29.png`} alt="" className="nav-item-img" loading="lazy" decoding="async" />, label: t("ampsTracker") },
  ];

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={closeMobileSidebar} />}
      <motion.aside
        className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
      <div className="sidebar-brand">
        <img src="/trackerlogo.png" alt="WIT" className="sidebar-logo-img" loading="lazy" decoding="async" />
        {!collapsed && <span className="sidebar-logo-text">WIT</span>}
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">{!collapsed && t("tracking")}</div>
        {navItems.map((item) => (
          <div
            key={item.key}
            className={`nav-item ${activePage === item.key ? "active" : ""}`}
            onClick={() => handleNavClick(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </div>
        ))}

        <div className="nav-divider" />
        <div className="nav-section">{!collapsed && t("tools")}</div>
        <div className={`nav-item ${activePage === "timers" ? "active" : ""}`} onClick={() => handleNavClick("/timers")}>
          <span className="nav-icon"><img src={`${WF_ICONS}/IconTimer%28xWhite%29.png`} alt="" className="nav-item-img" onError={hideImgOnError} loading="lazy" decoding="async" /></span>
          {!collapsed && <span className="nav-label">{t("timersTracker")}</span>}
        </div>
        <div className={`nav-item ${activePage === "activities" ? "active" : ""}`} onClick={() => handleNavClick("/activities")}>
          <span className="nav-icon"><img src={`${WF_ICONS}/IconAllyDown%28xRed%29.png`} alt="" className="nav-item-img" onError={hideImgOnError} loading="lazy" decoding="async" /></span>
          {!collapsed && <span className="nav-label">{t("activitiesPage")}</span>}
        </div>
        <div className={`nav-item ${activePage === "checklist" ? "active" : ""}`} onClick={() => handleNavClick("/checklist")}>
          <span className="nav-icon"><img src={`${WF_ICONS}/IconQuest%28xWhite%29.png`} alt="" className="nav-item-img" onError={hideImgOnError} loading="lazy" decoding="async" /></span>
          {!collapsed && <span className="nav-label">{t("checklistPage")}</span>}
        </div>
        <div className={`nav-item ${activePage === "farm" ? "active" : ""}`} onClick={() => handleNavClick("/farm")}>
          <span className="nav-icon"><img src={`${WF_ICONS}/IconMissionMarkerLoot%28xWhite%29.png`} alt="" className="nav-item-img" onError={hideImgOnError} loading="lazy" decoding="async" /></span>
          {!collapsed && <span className="nav-label">{t("farmPlanner")}</span>}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="nav-item" onClick={onOpenSettings}>
          <span className="nav-icon"><img src={`${WF_ICONS}/IconSalvage%28xWhite%29.png`} alt="" className="nav-item-img" loading="lazy" decoding="async" /></span>
          {!collapsed && <span className="nav-label">{t("settings")}</span>}
        </div>
        <div className="nav-item collapse-btn" onClick={toggleSidebar}>
          <span className="nav-icon">
            <LeftOutlined style={{ transition: "transform 0.25s", transform: collapsed ? "rotate(180deg)" : "none" }} />
          </span>
          {!collapsed && <span className="nav-label">{t("collapse")}</span>}
        </div>
      </div>
      </motion.aside>
    </>
  );
}
