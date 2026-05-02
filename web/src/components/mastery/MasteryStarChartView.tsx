import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Input } from "antd";
import { CheckOutlined, SearchOutlined, FilterOutlined } from "@ant-design/icons";
import { useTranslate } from "../../hooks/useTranslate";
import { useStarChartStore } from "../../stores/starChartStore";
import { useMasteryStore } from "../../stores/masteryStore";
import { requestJson } from "../../utils/helpers";
import SkeletonGrid, { SkeletonStatBar } from "../shared/SkeletonGrid";
import ErrorState from "../shared/ErrorState";

interface NodeDef {
  key: string;
  name: string;
  missionType: string;
  faction: string;
}

interface StarChartResponse {
  nodesByPlanet: Record<string, NodeDef[]>;
  xpPerNode: number;
}

const PLANET_ORDER = [
  "Mercury", "Venus", "Earth", "Lua", "Mars", "Phobos", "Deimos",
  "Ceres", "Jupiter", "Europa", "Saturn", "Uranus", "Neptune",
  "Pluto", "Eris", "Sedna", "Kuva Fortress", "Void", "Lua",
  "Zariman", "Duviri", "Veil",
];

const PLANET_ICONS: Record<string, string> = {
  Mercury: "https://wiki.warframe.com/images/IconMercury.png",
  Venus:   "https://wiki.warframe.com/images/IconVenus.png",
  Earth:   "https://wiki.warframe.com/images/IconEarth.png",
  Lua:     "https://wiki.warframe.com/images/IconLua.png",
  Mars:    "https://wiki.warframe.com/images/IconMars.png",
  Phobos:  "https://wiki.warframe.com/images/IconPhobos.png",
  Deimos:  "https://wiki.warframe.com/images/IconDeimos.png",
  Ceres:   "https://wiki.warframe.com/images/IconCeres.png",
  Jupiter: "https://wiki.warframe.com/images/IconJupiter.png",
  Europa:  "https://wiki.warframe.com/images/IconEuropa.png",
  Saturn:  "https://wiki.warframe.com/images/IconSaturn.png",
  Uranus:  "https://wiki.warframe.com/images/IconUranus.png",
  Neptune: "https://wiki.warframe.com/images/IconNeptune.png",
  Pluto:   "https://wiki.warframe.com/images/IconPluto.png",
  Eris:    "https://wiki.warframe.com/images/IconEris.png",
  Sedna:   "https://wiki.warframe.com/images/IconSedna.png",
};

export default function MasteryStarChartView() {
  const { t } = useTranslate();
  const completed = useStarChartStore((s) => s.completed);
  const toggle = useStarChartStore((s) => s.toggle);
  const mode = useMasteryStore((s) => s.mode);

  const [data, setData] = useState<StarChartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [activePlanet, setActivePlanet] = useState<string>("all");
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    requestJson<StarChartResponse>("/api/mastery/star-chart")
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const planetList = useMemo(() => {
    if (!data) return [] as string[];
    const present = new Set(Object.keys(data.nodesByPlanet));
    const ordered: string[] = [];
    const seen = new Set<string>();
    for (const p of PLANET_ORDER) {
      if (present.has(p) && !seen.has(p)) { ordered.push(p); seen.add(p); }
    }
    for (const p of present) if (!seen.has(p)) ordered.push(p);
    return ordered;
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [] as { planet: string; nodes: NodeDef[] }[];
    const q = search.trim().toLowerCase();
    return planetList
      .filter((p) => activePlanet === "all" || p === activePlanet)
      .map((p) => {
        let nodes = data.nodesByPlanet[p] || [];
        if (q) nodes = nodes.filter((n) => n.name.toLowerCase().includes(q) || n.missionType.toLowerCase().includes(q));
        if (showOnlyMissing) nodes = nodes.filter((n) => !completed[n.key]);
        return { planet: p, nodes };
      })
      .filter((p) => p.nodes.length > 0);
  }, [data, planetList, activePlanet, search, showOnlyMissing, completed]);

  const stats = useMemo(() => {
    if (!data) return { done: 0, total: 0, xp: 0, possibleXp: 0 };
    let done = 0;
    let total = 0;
    for (const arr of Object.values(data.nodesByPlanet)) {
      for (const n of arr) {
        total++;
        if (completed[n.key]) done++;
      }
    }
    return { done, total, xp: done * data.xpPerNode, possibleXp: total * data.xpPerNode };
  }, [data, completed]);

  const planetStats = useMemo(() => {
    if (!data) return {} as Record<string, { done: number; total: number }>;
    const out: Record<string, { done: number; total: number }> = {};
    for (const [p, arr] of Object.entries(data.nodesByPlanet)) {
      let done = 0;
      for (const n of arr) if (completed[n.key]) done++;
      out[p] = { done, total: arr.length };
    }
    return out;
  }, [data, completed]);

  if (loading) {
    return (
      <>
        <SkeletonStatBar count={3} />
        <SkeletonGrid variant="card" count={12} />
      </>
    );
  }
  if (error || !data) {
    return <ErrorState title={t("errorMasteryTitle")} description={t("errorMasteryDesc")} />;
  }

  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <>
      <div className="summary-bar mastery-summary-grid">
        <motion.div className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="stat-label">{t("masteryStarChartCleared")}</div>
          <div className="stat-value" style={{ color: "var(--wf-primary)" }}>
            {stats.done}<span className="mr-calc-stat-of"> / {stats.total}</span>
          </div>
          <div className="summary-progress-bar">
            <div className="summary-progress-fill cyan" style={{ width: `${pct}%` }} />
          </div>
        </motion.div>
        <motion.div className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="stat-label">{t("masteryStarChartXp")}</div>
          <div className="stat-value">{stats.xp.toLocaleString()}<span className="mr-calc-stat-of"> / {stats.possibleXp.toLocaleString()}</span></div>
          <div className="stat-sub">{data.xpPerNode} XP {t("masteryStarChartPerNode")}</div>
        </motion.div>
      </div>

      {mode === "sync" && (
        <div className="mastery-readonly-hint">{t("masteryStarChartSyncHint")}</div>
      )}

      <div className="craft-toolbar">
        <div className="craft-toolbar-left">
          <div className="craft-search-compact">
            <SearchOutlined className="craft-search-compact-icon" />
            <input
              className="craft-search-compact-input"
              placeholder={t("masteryStarChartSearchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="craft-search-clear" onClick={() => setSearch("")}>&times;</button>
            )}
          </div>
          <div className="craft-toolbar-divider" />
          <div className="craft-category-pills">
            <button
              className={`craft-category-pill ${activePlanet === "all" ? "active" : ""}`}
              onClick={() => setActivePlanet("all")}
            >
              {t("allCategories")}
            </button>
            {planetList.map((p) => {
              const ps = planetStats[p] || { done: 0, total: 0 };
              return (
                <button
                  key={p}
                  className={`craft-category-pill ${activePlanet === p ? "active" : ""}`}
                  onClick={() => setActivePlanet(p)}
                >
                  {p}
                  <span className="craft-category-pill-count">{ps.done}/{ps.total}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="craft-toolbar-right">
          <Button
            size="small"
            type={showOnlyMissing ? "primary" : "default"}
            icon={<FilterOutlined />}
            onClick={() => setShowOnlyMissing((v) => !v)}
          >
            {t("masteryFilterMissing")}
          </Button>
        </div>
      </div>

      <div className="mastery-sections">
        {filtered.map(({ planet, nodes }) => (
          <div key={planet} className="mastery-category">
            <div className="mastery-category-header">
              <span className="mastery-category-title">
                {PLANET_ICONS[planet] && (
                  <img src={PLANET_ICONS[planet]} alt="" style={{ width: 18, height: 18, marginRight: 6, verticalAlign: "middle" }} loading="lazy" />
                )}
                {planet}
              </span>
              <span className="mastery-category-count">
                {(planetStats[planet] || { done: 0, total: 0 }).done}/{(planetStats[planet] || { done: 0, total: 0 }).total}
              </span>
            </div>
            <div className="mastery-grid star-chart-grid">
              <AnimatePresence>
                {nodes.map((n) => {
                  const done = !!completed[n.key];
                  const hint = mode === "sync"
                    ? (done ? t("masteryStarChartCleared") : t("masteryStarChartTodo"))
                    : (done ? t("masteryClickReset") : t("masteryClickDone"));
                  return (
                    <motion.div
                      key={n.key}
                      className={`mastery-card star-node-card ${done ? "mastered" : ""}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.12 }}
                      onClick={() => mode === "manual" && toggle(n.key)}
                      style={{ cursor: mode === "manual" ? "pointer" : "default" }}
                    >
                      <div className="mastery-card-hover-hint">{hint}</div>
                      <div className="star-node-info">
                        <div className="star-node-name">{n.name}</div>
                        <div className="star-node-meta">
                          <span className="star-node-type">{n.missionType}</span>
                          <span className="star-node-faction">{n.faction}</span>
                        </div>
                      </div>
                      {done && (
                        <div className="star-node-badge">
                          <CheckOutlined />
                        </div>
                      )}
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
