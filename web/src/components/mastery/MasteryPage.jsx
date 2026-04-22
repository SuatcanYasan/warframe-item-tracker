import { useState, useMemo, useEffect, useRef } from "react";
import { SearchOutlined, TrophyFilled, InboxOutlined, DatabaseOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useTranslate } from "../../hooks/useTranslate";
import { useMasteryStore } from "../../stores/masteryStore";
import { requestJson } from "../../utils/helpers";

function getNextAction(status, t) {
  if (!status) return t("masteryClickOwned");
  if (status === "owned") return t("masteryClickMastered");
  return t("masteryClickReset");
}

const CATEGORY_ORDER = [
  "Warframes",
  "Primary",
  "Secondary",
  "Melee",
  "Companions",
  "Archwing",
  "Arch-Gun",
  "Arch-Melee",
];

export default function MasteryPage() {
  const { t } = useTranslate();
  const masteredItems = useMasteryStore((s) => s.masteredItems);
  const cycleStatus = useMasteryStore((s) => s.cycleStatus);

  const [categorizedItems, setCategorizedItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    requestJson("/api/mastery/items")
      .then((data) => {
        if (!cancelled) setCategorizedItems(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const scrollRef = useRef(null);

  // Wrap cycleStatus to preserve scroll
  const handleCycle = (uniqueName) => {
    const container = document.querySelector('.app-content');
    const scrollTop = container?.scrollTop || 0;
    cycleStatus(uniqueName);
    requestAnimationFrame(() => {
      if (container) container.scrollTop = scrollTop;
    });
  };

  const filteredCategories = useMemo(() => {
    if (!categorizedItems) return [];
    const query = search.trim().toLowerCase();

    return CATEGORY_ORDER
      .filter((cat) => categorizedItems[cat])
      .map((cat) => {
        let items = categorizedItems[cat];

        if (query) {
          items = items.filter(
            (i) =>
              i.name.toLowerCase().includes(query) ||
              (i.name || "").toLowerCase().includes(query)
          );
        }

        // Sort: mastered first, then owned, then none — alphabetical within each
        const statusOrder = { mastered: 0, owned: 1 };
        const sorted = [...items].sort((a, b) => {
          const aO = statusOrder[masteredItems[a.uniqueName]] ?? 2;
          const bO = statusOrder[masteredItems[b.uniqueName]] ?? 2;
          if (aO !== bO) return aO - bO;
          return a.name.localeCompare(b.name);
        });

        return { key: cat, items: sorted };
      })
      .filter((c) => c.items.length > 0);
  }, [categorizedItems, search, masteredItems]);

  const stats = useMemo(() => {
    if (!categorizedItems) return { total: 0, owned: 0, mastered: 0 };
    let total = 0, owned = 0, mastered = 0;
    for (const cat of CATEGORY_ORDER) {
      for (const i of (categorizedItems[cat] || [])) {
        total++;
        const s = masteredItems[i.uniqueName];
        if (s === "owned") owned++;
        else if (s === "mastered") mastered++;
      }
    }
    return { total, owned, mastered };
  }, [categorizedItems, masteredItems]);

  const categoryStats = useMemo(() => {
    if (!categorizedItems) return {};
    const result = {};
    for (const cat of CATEGORY_ORDER) {
      let owned = 0, mastered = 0;
      const items = categorizedItems[cat] || [];
      for (const i of items) {
        const s = masteredItems[i.uniqueName];
        if (s === "owned") owned++;
        else if (s === "mastered") mastered++;
      }
      result[cat] = { total: items.length, owned, mastered };
    }
    return result;
  }, [categorizedItems, masteredItems]);

  const visibleCategories = useMemo(() => {
    if (activeCategory === "all") return filteredCategories;
    return filteredCategories.filter((c) => c.key === activeCategory);
  }, [filteredCategories, activeCategory]);

  if (loading) {
    return (
      <div className="mastery-loading">
        <TrophyFilled className="mastery-loading-icon" />
        <span>{t("masteryLoading")}</span>
      </div>
    );
  }

  const pct = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;
  const ownedPct = stats.total > 0 ? Math.round((stats.owned / stats.total) * 100) : 0;
  const donutData = [
    { name: "done", value: Math.max(0, Math.min(100, pct)) },
    { name: "rem", value: 100 - Math.max(0, Math.min(100, pct)) },
  ];

  return (
    <>
      {/* Summary Cards */}
      <div className="summary-bar mastery-summary-grid">
        <motion.div className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <div className="stat-label"><DatabaseOutlined style={{ marginRight: 6 }} />{t("masteryTotalItems")}</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-sub">{t("masteryCategoryCount", { count: CATEGORY_ORDER.length })}</div>
        </motion.div>

        <motion.div className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="stat-label"><InboxOutlined style={{ marginRight: 6, color: "#3b82f6" }} />{t("masteryOwned")}</div>
          <div className="stat-value" style={{ color: "#3b82f6" }}>{stats.owned}</div>
          <div className="summary-progress-bar"><div className="summary-progress-fill" style={{ width: `${ownedPct}%`, background: "#3b82f6" }} /></div>
        </motion.div>

        <motion.div className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-label"><img src="https://wiki.warframe.com/images/IconMasteryRank.png" alt="" className="mastery-mr-icon" style={{ marginRight: 6, width: 14, height: 14 }} />{t("masteryMastered")}</div>
          <div className="stat-value" style={{ color: "var(--wf-primary)" }}>{stats.mastered}</div>
          <div className="summary-progress-bar"><div className="summary-progress-fill cyan" style={{ width: `${pct}%` }} /></div>
        </motion.div>

        <motion.div className="stat-card gold stat-card-donut" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="stat-label"><TrophyFilled style={{ marginRight: 6 }} />{t("overallProgress")}</div>
            <div className="stat-value">{stats.mastered} / {stats.total}</div>
            <div className="stat-sub">{t("masteryProgress", { mastered: stats.mastered, total: stats.total, pct })}</div>
          </div>
          <div style={{ width: 72, height: 72, position: "relative" }}>
            <ResponsiveContainer><PieChart><Pie data={donutData} cx="50%" cy="50%" innerRadius={24} outerRadius={34} startAngle={90} endAngle={-270} dataKey="value" stroke="none" isAnimationActive><Cell fill="var(--wf-primary)" /><Cell fill="color-mix(in srgb, var(--wf-text) 10%, transparent)" /></Pie></PieChart></ResponsiveContainer>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--wf-primary)", fontFamily: "var(--font-mono, monospace)" }}>%{pct}</div>
          </div>
        </motion.div>
      </div>

      {/* Toolbar */}
      <div className="craft-toolbar">
        <div className="craft-toolbar-left">
          <div className="craft-search-compact">
            <SearchOutlined className="craft-search-compact-icon" />
            <input
              className="craft-search-compact-input"
              placeholder={t("masterySearchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="craft-search-clear" onClick={() => setSearch("")}>
                &times;
              </button>
            )}
          </div>
          {filteredCategories.length > 1 && (
            <>
              <div className="craft-toolbar-divider" />
              <div className="craft-category-pills">
                <button
                  className={`craft-category-pill ${activeCategory === "all" ? "active" : ""}`}
                  onClick={() => setActiveCategory("all")}
                >
                  {t("allCategories")}
                </button>
                {filteredCategories.map((c) => {
                  const cs = categoryStats[c.key] || {};
                  return (
                    <button
                      key={c.key}
                      className={`craft-category-pill ${activeCategory === c.key ? "active" : ""}`}
                      onClick={() => setActiveCategory(c.key)}
                    >
                      {t(`masteryCategory${c.key}`) || c.key}
                      <span className="craft-category-pill-count">
                        {cs.mastered}/{cs.total}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Category sections */}
      <div className="mastery-sections">
        {visibleCategories.map((cat) => (
          <div key={cat.key} className="mastery-category">
            <div className="mastery-category-header">
              <span className="mastery-category-title">{t(`masteryCategory${cat.key}`) || cat.key}</span>
              <span className="mastery-category-count">
                {(categoryStats[cat.key] || {}).mastered}/{(categoryStats[cat.key] || {}).total}
              </span>
            </div>
            <div className="mastery-grid">
              <AnimatePresence>
                {cat.items.map((item) => {
                  const status = masteredItems[item.uniqueName];
                  return (
                    <motion.div
                      key={item.uniqueName}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                      className={`mastery-card ${status || ""}`}
                      onClick={() => handleCycle(item.uniqueName)}
                    >
                      <div className="mastery-card-hover-hint">
                        {getNextAction(status, t)}
                      </div>
                      <div className="mastery-card-img-wrap">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="mastery-card-img"
                            loading="lazy"
                          />
                        ) : (
                          <div className="mastery-card-img-placeholder" />
                        )}
                        {status === "owned" && (
                          <div className="mastery-card-badge owned-badge">
                            <InboxOutlined />
                          </div>
                        )}
                        {status === "mastered" && (
                          <div className="mastery-card-badge mastered-badge">
                            <img src="https://wiki.warframe.com/images/IconMasteryRank.png" alt="" className="mastery-mr-icon" />
                          </div>
                        )}
                      </div>
                      <div className="mastery-card-name" title={item.name}>
                        {item.name}
                      </div>
                      <div className="mastery-card-type">{item.type}</div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
