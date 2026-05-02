import { useEffect, useMemo, useState } from "react";
import { Progress, Tag, Tooltip, Segmented } from "antd";
import { RiseOutlined, ExperimentOutlined, AppstoreOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useTranslate } from "../../hooks/useTranslate";
import { useMasteryStore } from "../../stores/masteryStore";
import { showUndoToast } from "../../utils/undoToast";
import { requestJson } from "../../utils/helpers";
import SkeletonGrid, { SkeletonStatBar } from "../shared/SkeletonGrid";
import EmptyState from "../shared/EmptyState";
import type { MasteryItem, MasteryStatus } from "../../types";

const WF_ICONS = "https://wiki.warframe.com/images";

type CategorizedItems = Record<string, MasteryItem[]>;

interface RemainingItem extends MasteryItem {
  xp: number;
}

interface CategoryData {
  items: number;
  mastered: number;
  owned: number;
  earned: number;
  possible: number;
  remaining: RemainingItem[];
  xpPer: number;
}

interface CalculatorStats {
  totalXp: number;
  currentMR: number;
  nextThreshold: number;
  xpNeededForNext: number;
  progressInRank: number;
  perCategory: Record<string, CategoryData>;
  totalItemsAll: number;
  totalMasteredItems: number;
  totalOwnedItems: number;
}

const XP_PER_ITEM: Record<string, number> = {
  Warframes: 6000,
  Companions: 6000,
  Archwing: 6000,
  Necramechs: 6000,
  Primary: 3000,
  Secondary: 3000,
  Melee: 3000,
  "Arch-Gun": 3000,
  "Arch-Melee": 3000,
};

const MR_THRESHOLDS = [
  0, 2500, 7500, 15000, 25000, 37500, 52500, 70000, 90000, 112500,
  137500, 165000, 195000, 227500, 262500, 300000, 340000, 382500, 427500, 475000,
  525000, 577500, 632500, 690000, 750000, 812500, 877500, 945000, 1015000, 1087500,
  1162500, 1240000, 1320000, 1402500, 1487500, 1575000,
];

function mrFromXp(xp: number): number {
  let level = 0;
  for (let i = 0; i < MR_THRESHOLDS.length; i++) {
    if (xp >= MR_THRESHOLDS[i]) level = i;
    else break;
  }
  return level;
}

export default function MRCalculatorPage() {
  const { t } = useTranslate();
  const masteredItems = useMasteryStore((s) => s.masteredItems) as Record<string, MasteryStatus>;
  const cycleStatus = useMasteryStore((s) => s.cycleStatus);
  const setStatus = useMasteryStore((s) => s.setStatus);
  const [categorized, setCategorized] = useState<CategorizedItems | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [view, setView] = useState<"breakdown" | "suggestions">("breakdown");
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    requestJson("/api/mastery/items")
      .then((data) => { if (!cancelled) setCategorized(data as CategorizedItems); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo<CalculatorStats | null>(() => {
    if (!categorized) return null;
    let totalXp = 0;
    const perCategory: Record<string, CategoryData> = {};
    let totalItemsAll = 0;
    let totalMasteredItems = 0;
    let totalOwnedItems = 0;

    for (const [cat, items] of Object.entries(categorized)) {
      const xpPer = XP_PER_ITEM[cat] || 3000;
      let earned = 0;
      let mastered = 0;
      let owned = 0;
      const remaining: RemainingItem[] = [];
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

  interface RecItem extends RemainingItem {
    category: string;
  }

  const recommendations = useMemo<RecItem[]>(() => {
    if (!stats) return [];
    const all: RecItem[] = [];
    for (const [cat, data] of Object.entries(stats.perCategory)) {
      for (const item of data.remaining) {
        all.push({ ...item, category: cat });
      }
    }
    all.sort((a, b) => {
      if (a.xp !== b.xp) return b.xp - a.xp;
      return a.name.localeCompare(b.name);
    });
    return all.slice(0, 24);
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
        onChange={(v) => setView(v as "breakdown" | "suggestions")}
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
