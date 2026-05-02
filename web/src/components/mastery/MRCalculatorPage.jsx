import { useEffect, useMemo, useState } from "react";
import { Card, Progress, Tag, Button, Empty, Tooltip, Segmented } from "antd";
import { TrophyFilled, RiseOutlined, ExperimentOutlined, AppstoreOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useTranslate } from "../../hooks/useTranslate";
import { useMasteryStore } from "../../stores/masteryStore";
import { showUndoToast } from "../../utils/undoToast";
import { requestJson } from "../../utils/helpers";
import SkeletonGrid, { SkeletonStatBar } from "../shared/SkeletonGrid";
import EmptyState from "../shared/EmptyState";

const WF_ICONS = "https://wiki.warframe.com/images";

// Warframe per-item mastery XP (max rank).
// Source: https://warframe.fandom.com/wiki/Mastery_Rank
//   Warframes / Companions / Archwing → max rank 30 → 6000 XP
//   Weapons (Primary, Secondary, Melee, Arch-Gun, Arch-Melee) → max rank 30 → 3000 XP
//   Necramechs → max rank 40 → 6000 XP (treated like a Warframe)
//   K-Drive → 1500 XP at rank 30
//   Companion Pets (Kavat/Kubrow/MOA/Predasite/Vulpaphyla) → 6000 XP
const XP_PER_ITEM = {
  Warframes: 6000,
  Companions: 6000,   // pets and sentinels both 6000 in current WF
  Archwing: 6000,
  Necramechs: 6000,
  Primary: 3000,
  Secondary: 3000,
  Melee: 3000,
  "Arch-Gun": 3000,
  "Arch-Melee": 3000,
};

// Cumulative XP needed for each MR. Engineered curve:
//   MR n needs (n * 2500 + n²·n*0... ) total XP — exponential-ish.
// This table is the canonical one from the wiki (MR 0 → MR 30+).
const MR_THRESHOLDS = [
  0,        // MR 0 (start)
  2500,     // MR 1
  7500,     // MR 2
  15000,    // MR 3
  25000,    // MR 4
  37500,    // MR 5
  52500,    // MR 6
  70000,    // MR 7
  90000,    // MR 8
  112500,   // MR 9
  137500,   // MR 10
  165000,   // MR 11
  195000,   // MR 12
  227500,   // MR 13
  262500,   // MR 14
  300000,   // MR 15
  340000,   // MR 16
  382500,   // MR 17
  427500,   // MR 18
  475000,   // MR 19
  525000,   // MR 20
  577500,   // MR 21
  632500,   // MR 22
  690000,   // MR 23
  750000,   // MR 24
  812500,   // MR 25
  877500,   // MR 26
  945000,   // MR 27
  1015000,  // MR 28
  1087500,  // MR 29
  1162500,  // MR 30
  1240000,  // MR 31 (Legendary 1)
  1320000,  // MR 32
  1402500,  // MR 33
  1487500,  // MR 34
  1575000,  // MR 35
];

function ratioForStatus(status) {
  // Owned (rank below max) gives partial XP. We can't know exact rank,
  // so we assume Owned ≈ 50% (rank 15 average) — conservative.
  // Mastered = full XP.
  if (status === "mastered") return 1;
  if (status === "owned") return 0.5;
  return 0;
}

function mrFromXp(xp) {
  let level = 0;
  for (let i = 0; i < MR_THRESHOLDS.length; i++) {
    if (xp >= MR_THRESHOLDS[i]) level = i;
    else break;
  }
  return level;
}

export default function MRCalculatorPage() {
  const { t } = useTranslate();
  const masteredItems = useMasteryStore((s) => s.masteredItems);
  const cycleStatus = useMasteryStore((s) => s.cycleStatus);
  const setStatus = useMasteryStore((s) => s.setStatus);
  const [categorized, setCategorized] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("breakdown");
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    requestJson("/api/mastery/items")
      .then((data) => { if (!cancelled) setCategorized(data); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    if (!categorized) return null;
    let totalXp = 0;
    const perCategory = {};
    let totalItemsAll = 0;
    let totalMasteredItems = 0;
    let totalOwnedItems = 0;

    for (const [cat, items] of Object.entries(categorized)) {
      const xpPer = XP_PER_ITEM[cat] || 3000;
      let earned = 0;
      let mastered = 0;
      let owned = 0;
      const remaining = [];
      for (const item of items) {
        totalItemsAll++;
        const status = masteredItems[item.uniqueName];
        if (status === "mastered") {
          earned += xpPer;
          mastered++;
          totalMasteredItems++;
        } else if (status === "owned") {
          earned += xpPer * 0.5;
          owned++;
          totalOwnedItems++;
        } else {
          remaining.push({ ...item, xp: xpPer });
        }
      }
      const possible = items.length * xpPer;
      perCategory[cat] = {
        items: items.length,
        mastered,
        owned,
        earned,
        possible,
        remaining,
        xpPer,
      };
      totalXp += earned;
    }

    const currentMR = mrFromXp(totalXp);
    const nextThreshold = MR_THRESHOLDS[currentMR + 1] || MR_THRESHOLDS[MR_THRESHOLDS.length - 1];
    const prevThreshold = MR_THRESHOLDS[currentMR] || 0;
    const xpNeededForNext = Math.max(0, nextThreshold - totalXp);
    const xpRangeOfRank = nextThreshold - prevThreshold;
    const progressInRank = xpRangeOfRank > 0 ? Math.min(100, ((totalXp - prevThreshold) / xpRangeOfRank) * 100) : 100;

    return {
      totalXp,
      currentMR,
      nextThreshold,
      xpNeededForNext,
      progressInRank,
      perCategory,
      totalItemsAll,
      totalMasteredItems,
      totalOwnedItems,
    };
  }, [categorized, masteredItems]);

  // Top-priority remaining items: highest XP per item, alphabetized within
  // a category. Helps the user pick the next thing to farm.
  const recommendations = useMemo(() => {
    if (!stats) return [];
    const all = [];
    for (const [cat, data] of Object.entries(stats.perCategory)) {
      for (const item of data.remaining) {
        all.push({ ...item, category: cat });
      }
    }
    // Sort: highest XP first, then by name
    all.sort((a, b) => {
      if (a.xp !== b.xp) return b.xp - a.xp;
      return a.name.localeCompare(b.name);
    });
    return all.slice(0, 24); // top 24 — enough to fill a 4×6 grid
  }, [stats]);

  if (loading) {
    return (
      <div className="mr-calc-page">
        <SkeletonStatBar count={3} />
        <SkeletonGrid variant="card" count={9} />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="mastery"
        title={t("errorMasteryTitle")}
        description={t("errorMasteryDesc")}
      />
    );
  }

  if (!stats) return null;

  return (
    <div className="mr-calc-page">
      {/* Top stat bar */}
      <div className="summary-bar mr-calc-summary">
        <motion.div className="stat-card mr-calc-current-rank" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="stat-label">{t("mrCalcCurrent")}</div>
          <div className="mr-calc-rank-display">
            <img src={`${WF_ICONS}/IconMasteryRank.png`} alt="" loading="lazy" />
            <span className="mr-calc-rank-num">{stats.currentMR}</span>
          </div>
          <div className="stat-sub">{stats.totalXp.toLocaleString()} {t("mrCalcTotalXp")}</div>
        </motion.div>

        <motion.div className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="stat-label"><RiseOutlined /> {t("mrCalcNextRank", { rank: stats.currentMR + 1 })}</div>
          <div className="stat-value" style={{ color: "var(--wf-primary)" }}>
            {stats.xpNeededForNext.toLocaleString()}
          </div>
          <div className="stat-sub">{t("mrCalcXpNeeded")}</div>
          <Progress
            percent={Math.round(stats.progressInRank)}
            showInfo={false}
            size="small"
            strokeColor="var(--wf-primary)"
            trailColor="var(--wf-border)"
            style={{ marginTop: 8 }}
          />
        </motion.div>

        <motion.div className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-label"><AppstoreOutlined /> {t("mrCalcInventory")}</div>
          <div className="stat-value">{stats.totalMasteredItems}<span className="mr-calc-stat-of"> / {stats.totalItemsAll}</span></div>
          <div className="stat-sub">
            {t("mrCalcMasteredItems")} · {stats.totalOwnedItems} {t("masteryOwned").toLowerCase()}
          </div>
        </motion.div>
      </div>

      <Segmented
        block
        value={view}
        onChange={setView}
        options={[
          { label: t("mrCalcViewBreakdown"), value: "breakdown" },
          { label: t("mrCalcViewSuggestions"), value: "suggestions" },
        ]}
        style={{ margin: "16px 0 14px" }}
      />

      {/* Breakdown by category */}
      {view === "breakdown" && (
        <div className="mr-calc-grid">
          {Object.entries(stats.perCategory).map(([cat, data], i) => {
            if (data.items === 0) return null;
            const pct = data.possible > 0 ? Math.round((data.earned / data.possible) * 100) : 0;
            return (
              <motion.div
                key={cat}
                className="mr-calc-category-card"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="mr-calc-cat-header">
                  <span className="mr-calc-cat-name">{t(`masteryCategory${cat}`) || cat}</span>
                  <Tag color="default" className="mr-calc-cat-xp">{data.xpPer} XP</Tag>
                </div>
                <div className="mr-calc-cat-numbers">
                  <span className="mr-calc-cat-earned">{data.earned.toLocaleString()}</span>
                  <span className="mr-calc-cat-possible"> / {data.possible.toLocaleString()}</span>
                </div>
                <Progress
                  percent={pct}
                  showInfo={false}
                  size="small"
                  strokeColor="var(--wf-primary)"
                  trailColor="var(--wf-border)"
                />
                <div className="mr-calc-cat-meta">
                  <span><span className="mr-calc-cat-meta-num mastered">{data.mastered}</span> {t("masteryMastered").toLowerCase()}</span>
                  <span><span className="mr-calc-cat-meta-num owned">{data.owned}</span> {t("masteryOwned").toLowerCase()}</span>
                  <span><span className="mr-calc-cat-meta-num">{data.items - data.mastered - data.owned}</span> {t("mrCalcMissing")}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Suggestions: top items to farm next */}
      {view === "suggestions" && (
        recommendations.length === 0 ? (
          <EmptyState
            icon="done"
            title={t("mrCalcNothingMissing")}
            description={t("mrCalcNothingMissingDesc")}
          />
        ) : (
          <div className="mr-calc-suggestions">
            <p className="mr-calc-suggestions-hint">
              <ExperimentOutlined /> {t("mrCalcSuggestionsHint")}
            </p>
            <div className="mr-calc-suggestion-grid">
              {recommendations.map((item, i) => {
                // Click cycles status (none → owned → mastered → none),
                // matching the main Mastery grid. Undo toast lets the user
                // revert if they fat-fingered.
                const handleClick = () => {
                  const prev = useMasteryStore.getState().masteredItems[item.uniqueName];
                  cycleStatus(item.uniqueName);
                  showUndoToast({
                    message: t("mrCalcMarkedToast", { name: item.name }),
                    undoLabel: t("undo"),
                    onUndo: () => setStatus(item.uniqueName, prev),
                  });
                };
                return (
                  <Tooltip key={item.uniqueName} title={t("mrCalcClickToCycle")}>
                    <motion.button
                      type="button"
                      className="mr-calc-suggestion-card"
                      onClick={handleClick}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.025 }}
                    >
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} loading="lazy" />
                      ) : (
                        <div className="mr-calc-suggestion-img-fallback" />
                      )}
                      <div className="mr-calc-suggestion-name">{item.name}</div>
                      <div className="mr-calc-suggestion-cat">{t(`masteryCategory${item.category}`) || item.category}</div>
                      <Tag color="gold" className="mr-calc-suggestion-xp">+{item.xp.toLocaleString()} XP</Tag>
                    </motion.button>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
}
