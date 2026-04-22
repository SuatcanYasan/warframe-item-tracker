import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  RightOutlined,
  PlusOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { useRelativeTime } from "../../hooks/useRelativeTime";
import { useTranslate } from "../../hooks/useTranslate";
import { useAppStore } from "../../stores/appStore";
import { requestJson } from "../../utils/helpers";
import { useCraftStore } from "../../stores/craftStore";
import { useRelicStore } from "../../stores/relicStore";
import { useInventoryStore } from "../../stores/inventoryStore";
import { useMasteryStore } from "../../stores/masteryStore";

const WF_ICONS = "https://wiki.warframe.com/images";

function EmptyCTA({ label, onClick }) {
  return (
    <button className="dashboard-empty-cta" onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <PlusOutlined /> {label}
    </button>
  );
}

function PreviewRow({ items, totalCount, moreLabel }) {
  if (!items.length) return null;
  const extra = totalCount - items.length;
  return (
    <div className="dashboard-card-previews">
      {items.map((p, j) => (
        <div key={j} className="dashboard-preview-item">
          {p.img && <img src={p.img} alt="" className="dashboard-preview-img" loading="lazy" decoding="async" />}
          <span className="dashboard-preview-name">{p.name}</span>
        </div>
      ))}
      {extra > 0 && <span className="dashboard-preview-more">+{extra} {moreLabel}</span>}
    </div>
  );
}

function MiniDonut({ percent, size = 52, color = "var(--wf-primary)" }) {
  const data = [
    { value: Math.max(0, Math.min(100, percent)) },
    { value: 100 - Math.max(0, Math.min(100, percent)) },
  ];
  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={size * 0.38} outerRadius={size * 0.48} startAngle={90} endAngle={-270} dataKey="value" stroke="none" isAnimationActive>
            <Cell fill={color} />
            <Cell fill="color-mix(in srgb, var(--wf-text) 8%, transparent)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color, fontFamily: "var(--font-mono, monospace)" }}>
        %{percent}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslate();
  const navigate = useNavigate();
  const primaryColor = useAppStore((s) => s.customThemeTokens?.colorPrimary) || "#CA8A04";

  const selectedItems = useCraftStore((s) => s.selectedItems);
  const completedMap = useCraftStore((s) => s.completedMap);
  const calculation = useCraftStore((s) => s.calculation);
  const openSearchDrawer = useCraftStore((s) => s.openSearchDrawer);

  const foundComponents = useRelicStore((s) => s.foundComponents);

  const inventoryParts = useInventoryStore((s) => s.inventoryParts);

  const masteredItems = useMasteryStore((s) => s.masteredItems);

  // Craft stats
  const craftStats = useMemo(() => {
    const totals = calculation.totals || [];
    const total = totals.length;
    const done = totals.filter((r) => {
      const completed = completedMap[r.uniqueName] || 0;
      return completed >= (r.totalNeeded || r.quantity || 1);
    }).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { tracking: selectedItems.length, done, total, pct };
  }, [selectedItems, calculation, completedMap]);

  // Relic stats
  const relicStats = useMemo(() => {
    const primes = Object.keys(foundComponents);
    let totalComps = 0;
    let foundCount = 0;
    for (const comps of Object.values(foundComponents)) {
      for (const [, found] of Object.entries(comps)) {
        totalComps++;
        if (found) foundCount++;
      }
    }
    return { primes: primes.length, found: foundCount, total: totalComps };
  }, [foundComponents]);

  // Inventory stats
  const invStats = useMemo(() => {
    const parts = Object.values(inventoryParts);
    const totalQty = parts.reduce((s, p) => s + (p.quantity || 0), 0);
    const sets = new Set(parts.map((p) => p.parentUniqueName)).size;
    return { parts: parts.length, totalQty, sets };
  }, [inventoryParts]);

  // Mastery stats
  const masteryStats = useMemo(() => {
    let owned = 0, mastered = 0;
    for (const v of Object.values(masteredItems)) {
      if (v === "owned") owned++;
      else if (v === "mastered") mastered++;
    }
    return { owned, mastered, total: owned + mastered };
  }, [masteredItems]);

  // Preview items for each card
  const craftPreviews = useMemo(() =>
    selectedItems.slice(0, 3).map((i) => ({ name: i.name, img: i.imageUrl })),
  [selectedItems]);

  const invPreviews = useMemo(() => {
    const parts = Object.values(inventoryParts);
    return parts.slice(0, 3).map((p) => ({ name: p.parentName || p.name, img: p.parentImageUrl }));
  }, [inventoryParts]);

  const MR_ICON = `${WF_ICONS}/IconMasteryRank.png`;
  const relicPct = relicStats.total > 0 ? Math.round((relicStats.found / relicStats.total) * 100) : 0;

  // Bar chart data — hex colors only (CSS vars don't work in SVG)
  const barData = useMemo(() => [
    { name: "Craft", pct: craftStats.pct, fill: primaryColor },
    { name: "Relic", pct: relicPct, fill: "#a855f7" },
    { name: "Vault", pct: invStats.parts > 0 ? 100 : 0, fill: "#3b82f6" },
    { name: "Mastery", pct: masteryStats.total > 0 ? Math.round((masteryStats.mastered / 820) * 100) : 0, fill: "#f59e0b" },
  ], [craftStats.pct, relicPct, invStats.parts, masteryStats, primaryColor]);

  // Almost complete craft items (>= 50% done)
  const almostDone = useMemo(() => {
    if (!calculation.perItem) return [];
    return selectedItems
      .map((item) => {
        const reqs = (calculation.perItem || []).find((p) => p.uniqueName === item.uniqueName);
        if (!reqs || !reqs.requirements) return null;
        const total = reqs.requirements.length;
        const done = reqs.requirements.filter((r) => (completedMap[r.uniqueName] || 0) >= (r.totalNeeded || r.quantity || 1)).length;
        if (total === 0 || done === total) return null;
        const pct = Math.round((done / total) * 100);
        if (pct < 40) return null;
        return { name: item.name, img: item.imageUrl, done, total, pct };
      })
      .filter(Boolean)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3);
  }, [selectedItems, calculation, completedMap]);

  // Last added item
  const lastAdded = useMemo(() => {
    if (!selectedItems.length) return null;
    const sorted = [...selectedItems].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    return sorted[0];
  }, [selectedItems]);
  const lastAddedTime = useRelativeTime(lastAdded?.addedAt);

  // Tips
  const tips = useMemo(() => [
    t("tipDragReorder"),
    t("tipShortcuts"),
    t("tipThemeEditor"),
    t("tipRelicSync"),
    t("tipScreenshot"),
  ], [t]);
  const [tipIdx, setTipIdx] = useState(() => Math.floor(Math.random() * 5));
  useEffect(() => {
    const iv = setInterval(() => {
      setTipIdx((prev) => {
        let next;
        do { next = Math.floor(Math.random() * tips.length); } while (next === prev && tips.length > 1);
        return next;
      });
    }, 8000);
    return () => clearInterval(iv);
  }, [tips.length]);

  // Craft category distribution for donut
  const CATEGORY_COLORS = { Warframes: "#CA8A04", Primary: "#3b82f6", Secondary: "#a855f7", Melee: "#ef4444", Sentinels: "#22c55e", Archwing: "#06b6d4", Other: "#64748b" };
  const categoryDonut = useMemo(() => {
    const map = {};
    for (const item of selectedItems) {
      const cat = item.category || item.type || "Other";
      map[cat] = (map[cat] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      fill: CATEGORY_COLORS[name] || CATEGORY_COLORS.Other,
    }));
  }, [selectedItems]);

  // Mastery status donut
  const masteryDonut = useMemo(() => {
    const none = 820 - masteryStats.owned - masteryStats.mastered;
    return [
      { name: t("masteryOwned"), value: masteryStats.owned, fill: "#3b82f6" },
      { name: t("masteryMastered"), value: masteryStats.mastered, fill: "#f59e0b" },
      { name: t("notMastered"), value: Math.max(0, none), fill: "#1E293B" },
    ].filter((d) => d.value > 0);
  }, [masteryStats, t]);

  // Timer data for dashboard widget
  const [timerData, setTimerData] = useState(null);
  useEffect(() => {
    requestJson("/api/timers").then(setTimerData).catch(() => {});
    const iv = setInterval(() => requestJson("/api/timers").then(setTimerData).catch(() => {}), 60000);
    return () => clearInterval(iv);
  }, []);

  // Live countdown from expiry
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Re-fetch timers when any cycle expires
  const anyExpired = useMemo(() => {
    if (!timerData) return false;
    const checks = [timerData.cetus?.expiry, timerData.vallis?.expiry, timerData.cambion?.expiry];
    return checks.some((e) => e && new Date(e).getTime() <= now);
  }, [timerData, now]);

  useEffect(() => {
    if (anyExpired) requestJson("/api/timers").then(setTimerData).catch(() => {});
  }, [anyExpired]);

  function formatCountdown(expiry) {
    if (!expiry) return "—";
    const diff = new Date(expiry).getTime() - now;
    if (diff <= 0) return "0:00";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
  }

  // Timer slides for dashboard
  const timerSlides = useMemo(() => {
    if (!timerData) return [];
    const slides = [];
    if (timerData.cetus) slides.push({ title: t("timersCetus"), emoji: timerData.cetus.isDay ? "☀️" : "🌙", stateLabel: timerData.cetus.isDay ? t("timersDay") : t("timersNight"), color: timerData.cetus.isDay ? "#f59e0b" : "#6366f1", bg: "/Cetus.webp", expiry: timerData.cetus.expiry });
    if (timerData.vallis) slides.push({ title: t("timersFortuna"), emoji: timerData.vallis.isWarm ? "🔥" : "❄️", stateLabel: timerData.vallis.isWarm ? t("timersWarm") : t("timersCold"), color: timerData.vallis.isWarm ? "#ef4444" : "#06b6d4", bg: "/Orb_Vallis.webp", expiry: timerData.vallis.expiry });
    if (timerData.cambion) slides.push({ title: t("timersDeimos"), emoji: "🔴", stateLabel: timerData.cambion.state === "fass" ? "Fass" : "Vome", color: timerData.cambion.state === "fass" ? "#ef4444" : "#3b82f6", bg: "/deimos.webp", expiry: timerData.cambion.expiry });
    return slides;
  }, [timerData, t]);

  const [slideIdx, setSlideIdx] = useState(0);
  useEffect(() => {
    if (timerSlides.length <= 1) return;
    const iv = setInterval(() => setSlideIdx((i) => (i + 1) % timerSlides.length), 5000);
    return () => clearInterval(iv);
  }, [timerSlides.length]);

  // Top stats
  const totalTracked = selectedItems.length + relicStats.primes + invStats.parts + masteryStats.total;

  return (
    <div className="dashboard-page">
      <div className="dashboard-welcome">
        <img src="/trackerlogo.png" alt="WIT" className="dashboard-logo" loading="lazy" decoding="async" />
        <div className="dashboard-welcome-text">
          <h1 className="dashboard-title">{t("dashboardTitle")}</h1>
          <p className="dashboard-subtitle">{t("dashboardSubtitle")}</p>
        </div>
      </div>

      {/* Tip */}
      <div className="dashboard-tip">
        <BulbOutlined className="tip-icon" />
        <span className="tip-text" key={tipIdx}>{tips[tipIdx]}</span>
      </div>

      {/* Stats + Timer Row */}
      <div className="dashboard-stats-row">
        <div className="dashboard-stats-strip">
          <div className="strip-stat"><span className="strip-value">{totalTracked}</span><span className="strip-label">{t("dashboardTotalTracked")}</span></div>
          <div className="strip-divider" />
          <div className="strip-stat"><span className="strip-value" style={{ color: "var(--wf-primary)" }}>{craftStats.pct}%</span><span className="strip-label">{t("craftTracker")}</span></div>
          <div className="strip-divider" />
          <div className="strip-stat"><span className="strip-value" style={{ color: "#a855f7" }}>{relicPct}%</span><span className="strip-label">{t("relicTracker")}</span></div>
          <div className="strip-divider" />
          <div className="strip-stat"><span className="strip-value" style={{ color: "#f59e0b" }}>{masteryStats.mastered}</span><span className="strip-label">{t("masteryMastered")}</span></div>
          {lastAdded && (<><div className="strip-divider" /><div className="strip-stat"><ClockCircleOutlined className="strip-icon" /><span className="strip-label">{lastAddedTime}</span></div></>)}
        </div>
        <div className="dashboard-stats-strip timer-strip-inline" onClick={() => navigate("/timers")}>
          {timerData ? (<>
            {timerData.cetus && <div className="strip-stat"><span className="strip-value" style={{ fontSize: 14 }}>{timerData.cetus.isDay ? "☀️" : "🌙"}</span><span className="strip-label">Cetus <b style={{ color: timerData.cetus.isDay ? "#f59e0b" : "#6366f1" }}>{timerData.cetus.isDay ? t("timersDay") : t("timersNight")}</b> {formatCountdown(timerData.cetus.expiry)}</span></div>}
            <div className="strip-divider" />
            {timerData.vallis && <div className="strip-stat"><span className="strip-value" style={{ fontSize: 14 }}>{timerData.vallis.isWarm ? "🔥" : "❄️"}</span><span className="strip-label">Fortuna <b style={{ color: timerData.vallis.isWarm ? "#ef4444" : "#06b6d4" }}>{timerData.vallis.isWarm ? t("timersWarm") : t("timersCold")}</b> {formatCountdown(timerData.vallis.expiry)}</span></div>}
            <div className="strip-divider" />
            {timerData.cambion && <div className="strip-stat"><span className="strip-value" style={{ fontSize: 14 }}>🔴</span><span className="strip-label">Deimos <b style={{ color: timerData.cambion.state === "fass" ? "#ef4444" : "#3b82f6" }}>{timerData.cambion.state === "fass" ? "Fass" : "Vome"}</b> {formatCountdown(timerData.cambion.expiry)}</span></div>}
          </>) : (
            <div className="skeleton-line wide" style={{ height: 12 }} />
          )}
        </div>
      </div>

      {/* Charts row */}
      <div className="dashboard-charts-row">
        <motion.div className="dashboard-chart-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="dashboard-chart-title">{t("dashboardProgressTitle")}</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={barData} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
              <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis type="number" domain={[0, 100]} hide />
              <Tooltip formatter={(v) => [`%${v}`, t("overallProgress")]} contentStyle={{ background: "#1A1A28", border: `1px solid ${primaryColor}33`, borderRadius: 8, fontSize: 12, color: "#E2E8F0", boxShadow: `0 4px 16px ${primaryColor}15` }} labelStyle={{ color: primaryColor, fontWeight: 600 }} itemStyle={{ color: "#E2E8F0" }} cursor={{ fill: "rgba(255,255,255,0.06)", radius: 4 }} />
              <Bar dataKey="pct" radius={[6, 6, 0, 0]} barSize={32} isAnimationActive animationDuration={800}>
                {barData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Timer Slider */}
        {timerSlides.length === 0 ? (
          <div className="dashboard-timer-skeleton">
            <div className="skeleton-line wide" />
            <div className="skeleton-line medium" />
            <div className="skeleton-line narrow" />
          </div>
        ) : (
          <motion.div className="dashboard-timer-slider" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} onClick={() => navigate("/timers")} style={{ backgroundImage: `url(${timerSlides[slideIdx]?.bg})` }}>
            <div className="timer-slider-overlay" />
            <div className="timer-slider-content">
              <div className="timer-slider-top">
                <span className="timer-slider-emoji">{timerSlides[slideIdx]?.emoji}</span>
                <span className="timer-slider-title">{timerSlides[slideIdx]?.title}</span>
                <RightOutlined className="timer-slider-arrow" />
              </div>
              <div className="timer-slider-state" style={{ color: timerSlides[slideIdx]?.color }}>{timerSlides[slideIdx]?.stateLabel}</div>
              <div className="timer-slider-countdown">{formatCountdown(timerSlides[slideIdx]?.expiry)}</div>
            </div>
            <div className="timer-slider-dots">
              {timerSlides.map((_, i) => <span key={i} className={`slider-dot ${i === slideIdx ? "active" : ""}`} onClick={(e) => { e.stopPropagation(); setSlideIdx(i); }} />)}
            </div>
          </motion.div>
        )}
      </div>

      {/* Almost complete */}
      {almostDone.length > 0 && (
        <motion.div className="dashboard-almost" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <div className="almost-title"><FireOutlined style={{ color: "#ef4444", marginRight: 6 }} />{t("dashboardAlmostDone")}</div>
          {almostDone.map((item, i) => (
            <div key={i} className="almost-item">
              {item.img && <img src={item.img} alt="" className="almost-img" loading="lazy" decoding="async" />}
              <span className="almost-name">{item.name}</span>
              <span className="almost-pct">{item.done}/{item.total}</span>
              <div className="almost-bar"><div className="almost-bar-fill" style={{ width: `${item.pct}%` }} /></div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Hero — Craft */}
      <motion.div className="dashboard-card dashboard-hero" style={{ "--accent": "var(--wf-primary)" }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} onClick={() => navigate("/craft")}>
        <div className="dashboard-card-header">
          <img src={`${WF_ICONS}/IconCategoryModular%28xWhite%29.png`} alt="" className="dashboard-card-icon" loading="lazy" decoding="async" />
          <span className="dashboard-card-title">{t("craftTracker")}</span>
          <button className="dashboard-quick-action" onClick={(e) => { e.stopPropagation(); openSearchDrawer(); navigate("/craft"); }}><PlusOutlined /> {t("addItem")}</button>
          <RightOutlined className="dashboard-card-arrow" />
        </div>
        <p className="dashboard-card-desc">{t("craftTrackerDesc")}</p>
        <div className="dashboard-card-stats">
          <div className="dashboard-stat"><span className="dashboard-stat-value">{craftStats.tracking}</span><span className="dashboard-stat-label">{t("selected")}</span></div>
          <div className="dashboard-stat"><span className="dashboard-stat-value">{craftStats.done}/{craftStats.total}</span><span className="dashboard-stat-label">{t("completed")}</span></div>
          <div className="dashboard-stat donut-stat"><MiniDonut percent={craftStats.pct} size={64} /></div>
        </div>
        {craftPreviews.length > 0 ? <PreviewRow items={craftPreviews} totalCount={selectedItems.length} moreLabel={t("dashboardMore")} /> : <EmptyCTA label={t("dashboardAddFirst")} onClick={() => { openSearchDrawer(); navigate("/craft"); }} />}
        <div className="dashboard-card-bar"><div className="dashboard-card-bar-fill" style={{ width: `${craftStats.pct}%` }} /></div>
      </motion.div>

      {/* Secondary 3-col */}
      <div className="dashboard-grid-secondary">
        <motion.div className="dashboard-card" style={{ "--accent": "#a855f7" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} onClick={() => navigate("/relic")}>
          <div className="dashboard-card-header"><img src={`${WF_ICONS}/IconProjectionT1%28xWhite%29.png`} alt="" className="dashboard-card-icon" loading="lazy" decoding="async" /><span className="dashboard-card-title">{t("relicTracker")}</span><RightOutlined className="dashboard-card-arrow" /></div>
          <div className="dashboard-card-stats">
            <div className="dashboard-stat"><span className="dashboard-stat-value">{relicStats.primes}</span><span className="dashboard-stat-label">{t("watchedPrimes")}</span></div>
            <div className="dashboard-stat"><span className="dashboard-stat-value">{relicStats.found}/{relicStats.total}</span><span className="dashboard-stat-label">{t("componentFound")}</span></div>
            <div className="dashboard-stat donut-stat"><MiniDonut percent={relicPct} color="#a855f7" /></div>
          </div>
          {relicStats.primes === 0 && <EmptyCTA label={t("dashboardWatchPrime")} onClick={() => navigate("/relic")} />}
          <div className="dashboard-card-bar"><div className="dashboard-card-bar-fill" style={{ width: `${relicPct}%` }} /></div>
        </motion.div>

        <motion.div className="dashboard-card" style={{ "--accent": "#3b82f6" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} onClick={() => navigate("/inventory")}>
          <div className="dashboard-card-header"><img src={`${WF_ICONS}/IconBundle%28xWhite%29.png`} alt="" className="dashboard-card-icon" loading="lazy" decoding="async" /><span className="dashboard-card-title">{t("inventoryTracker")}</span><RightOutlined className="dashboard-card-arrow" /></div>
          <div className="dashboard-card-stats">
            <div className="dashboard-stat"><span className="dashboard-stat-value">{invStats.parts}</span><span className="dashboard-stat-label">{t("partsTab")}</span></div>
            <div className="dashboard-stat"><span className="dashboard-stat-value">{invStats.sets}</span><span className="dashboard-stat-label">{t("setsTab")}</span></div>
            <div className="dashboard-stat"><span className="dashboard-stat-value">{invStats.totalQty}</span><span className="dashboard-stat-label">{t("partQuantity")}</span></div>
          </div>
          {invPreviews.length > 0 ? <PreviewRow items={invPreviews} totalCount={invStats.parts} moreLabel={t("dashboardMore")} /> : <EmptyCTA label={t("dashboardAddPart")} onClick={() => navigate("/inventory")} />}
          <div className="dashboard-card-bar"><div className="dashboard-card-bar-fill" style={{ width: "0%" }} /></div>
        </motion.div>

        <motion.div className="dashboard-card" style={{ "--accent": "#f59e0b" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} onClick={() => navigate("/mastery")}>
          <div className="dashboard-card-header"><img src={MR_ICON} alt="" className="dashboard-card-icon" loading="lazy" decoding="async" /><span className="dashboard-card-title">{t("masteryTracker")}</span><RightOutlined className="dashboard-card-arrow" /></div>
          <div className="dashboard-card-stats">
            <div className="dashboard-stat"><span className="dashboard-stat-value"><InboxOutlined style={{ color: "#3b82f6", marginRight: 4, fontSize: 16 }} />{masteryStats.owned}</span><span className="dashboard-stat-label">{t("masteryOwned")}</span></div>
            <div className="dashboard-stat"><span className="dashboard-stat-value"><img src={MR_ICON} alt="" style={{ width: 16, height: 16, marginRight: 4 }} loading="lazy" decoding="async" />{masteryStats.mastered}</span><span className="dashboard-stat-label">{t("masteryMastered")}</span></div>
            <div className="dashboard-stat"><span className="dashboard-stat-value">{masteryStats.total}</span><span className="dashboard-stat-label">{t("masteryTotalItems")}</span></div>
          </div>
          {masteryStats.total === 0 && <EmptyCTA label={t("dashboardStartMastery")} onClick={() => navigate("/mastery")} />}
          <div className="dashboard-card-bar"><div className="dashboard-card-bar-fill" style={{ width: "0%" }} /></div>
        </motion.div>
      </div>

    </div>
  );
}
