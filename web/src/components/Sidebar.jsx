import { useNavigate, useLocation } from "react-router-dom";
import { AppstoreOutlined, SettingOutlined, LeftOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";

const IMG_BASE = "https://cdn.jsdelivr.net/gh/WFCD/warframe-items@master/data/img";

export default function Sidebar({ t, collapsed, setCollapsed, onOpenSettings }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activePage = location.pathname === "/relic" ? "relic" : "craft";

  const navItems = [
    { key: "craft", path: "/", icon: <img src={`${IMG_BASE}/orokin-cell-0d237af036.png`} alt="" className="nav-item-img" />, label: t("craftTracker") },
    { key: "relic", path: "/relic", icon: <img src={`${IMG_BASE}/lith-relic.png`} alt="" className="nav-item-img" />, label: t("relicTracker") },
  ];

  return (
    <motion.aside
      className={`sidebar ${collapsed ? "collapsed" : ""}`}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="sidebar-brand">
        <img src="/trackerlogo.png" alt="WIT" className="sidebar-logo-img" />
        {!collapsed && <span className="sidebar-logo-text">WIT</span>}
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">{!collapsed && t("tracking")}</div>
        {navItems.map((item) => (
          <div
            key={item.key}
            className={`nav-item ${activePage === item.key ? "active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </div>
        ))}

        <div className="nav-divider" />
        <div className="nav-section">{!collapsed && t("tools")}</div>
        <div className="nav-item disabled">
          <span className="nav-icon"><AppstoreOutlined /></span>
          {!collapsed && <span className="nav-label">{t("farmPlanner")}</span>}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="nav-item" onClick={onOpenSettings}>
          <span className="nav-icon"><SettingOutlined /></span>
          {!collapsed && <span className="nav-label">{t("settings")}</span>}
        </div>
        <div className="nav-item collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          <span className="nav-icon">
            <LeftOutlined style={{ transition: "transform 0.25s", transform: collapsed ? "rotate(180deg)" : "none" }} />
          </span>
          {!collapsed && <span className="nav-label">{t("collapse")}</span>}
        </div>
      </div>
    </motion.aside>
  );
}
