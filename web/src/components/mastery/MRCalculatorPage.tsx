import { useEffect, useMemo, useState } from "react";
import { Progress, Tag, Tooltip, Segmented, Alert, Button } from "antd";
import { RiseOutlined, ExperimentOutlined, AppstoreOutlined, CloudDownloadOutlined, CheckCircleFilled, ClockCircleOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useTranslate } from "../../hooks/useTranslate";
import { useMasteryStore } from "../../stores/masteryStore";
import { showUndoToast } from "../../utils/undoToast";
import { requestJson } from "../../utils/helpers";
import { useRelativeTime } from "../../hooks/useRelativeTime";
import SkeletonGrid, { SkeletonStatBar } from "../shared/SkeletonGrid";
import EmptyState from "../shared/EmptyState";
import type { MasteryItem, MasteryStatus } from "../../types";
import {
  computeCumulativeXP,
  getMRForXP,
  getRankProgress,
  getMRRankTitle,
  MAX_REGULAR_MR,
} from "../../constants/masteryXp";

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
  /** True when realMR + realTotalXp came from a profile import. */
  fromProfile: boolean;
  /** Whether this user even has any data to display (false → CTA to import). */
  hasAnyData: boolean;
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

function BreakdownRow({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="mr-calc-breakdown-row">
      <span className="mr-calc-breakdown-label">{label}</span>
      <span className="mr-calc-breakdown-value">{value.toLocaleString()}</span>
      {hint && <span className="mr-calc-breakdown-hint">{hint}</span>}
    </div>
  );
}

export default function MRCalculatorPage() {
  const { t } = useTranslate();
  const masteredItems = useMasteryStore((s) => s.masteredItems) as Record<string, MasteryStatus>;
  const cycleStatus = useMasteryStore((s) => s.cycleStatus);
  const setStatus = useMasteryStore((s) => s.setStatus);
  // From profile import. When set, override the per-item estimate with
  // the actual in-game MR (DE knows the truth, our heuristic doesn't).
  const realMR = useMasteryStore((s) => s.realMR);
  const realTotalXp = useMasteryStore((s) => s.realTotalXp);
  const realBreakdown = useMasteryStore((s) => s.realBreakdown);
  const realDisplayName = useMasteryStore((s) => s.realDisplayName);
  const lastImportAt = useMasteryStore((s) => s.lastImportAt);
  const lastImportRelative = useRelativeTime(lastImportAt);
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

    // Profile import wins. Otherwise fall back to per-item heuristic
    // (which is wildly imprecise — items only contribute ~80% of MR XP).
    const useReal = typeof realMR === "number" && typeof realTotalXp === "number";
    const effectiveTotalXp = useReal ? (realTotalXp as number) : totalXp;
    const fallbackMR = getMRForXP(totalXp);
    const currentMR = useReal ? (realMR as number) : fallbackMR;
    const progress = getRankProgress(useReal ? effectiveTotalXp : totalXp);

    return {
      totalXp: effectiveTotalXp,
      currentMR,
      nextThreshold: progress.nextThreshold,
      xpNeededForNext: progress.xpToNext,
      progressInRank: progress.progressPct,
      perCategory,
      totalItemsAll,
      totalMasteredItems,
      totalOwnedItems,
      fromProfile: useReal,
      hasAnyData: useReal || totalMasteredItems + totalOwnedItems > 0,
    };
  }, [categorized, masteredItems, realMR, realTotalXp]);

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
      {/* Source banner — green if real, amber estimate warning otherwise */}
      {stats.fromProfile ? (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleFilled />}
          message={
            <span>
              <strong>{t("mrCalcSourceProfile")}</strong>
              {lastImportRelative && (
                <span style={{ marginLeft: 8, color: "var(--wf-text-muted)", fontSize: 12 }}>
                  <ClockCircleOutlined /> {lastImportRelative}
                </span>
              )}
            </span>
          }
          style={{ marginBottom: 12 }}
        />
      ) : (
        <Alert
          type="warning"
          showIcon
          message={t("mrCalcSourceEstimate")}
          description={t("mrCalcSourceEstimateDesc")}
          style={{ marginBottom: 12 }}
        />
      )}

      {/* Hero "product" card — the user asked for the MR area to feel
          more detailed, like a product page rather than three small
          stat tiles. Big rank badge on the left, meta + progress on
          the right, with the inventory/XP row tucked underneath. */}
      <motion.div
        className="mr-hero-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mr-hero-main">
          <div className="mr-hero-badge">
            <img src={`${WF_ICONS}/IconMasteryRank.png`} alt="" loading="lazy" />
            <span className="mr-hero-badge-num">{stats.currentMR}</span>
            {stats.currentMR >= MAX_REGULAR_MR && (
              <span className="mr-hero-badge-lr">LR</span>
            )}
          </div>
          <div className="mr-hero-info">
            <div className="mr-hero-label">
              {realDisplayName ? (
                <>
                  <span className="mr-hero-tenno">{realDisplayName}</span>
                  <span className="mr-hero-sep">·</span>
                  <span>{t("mrCalcCurrent")}</span>
                </>
              ) : (
                t("mrCalcCurrent")
              )}
            </div>
            <div className="mr-hero-title">
              {getMRRankTitle(stats.currentMR)}
            </div>
            <div className="mr-hero-meta-row">
              <span className="mr-hero-meta">
                <span className="mr-hero-meta-label">{t("mrCalcTotalXp")}</span>
                <strong>{stats.totalXp.toLocaleString()}</strong>
              </span>
              <span className="mr-hero-meta">
                <span className="mr-hero-meta-label">{t("mrCalcMasteredItems")}</span>
                <strong>
                  {stats.totalMasteredItems}
                  <span className="mr-hero-meta-of"> / {stats.totalItemsAll}</span>
                </strong>
              </span>
              <span className="mr-hero-meta">
                <span className="mr-hero-meta-label">{t("masteryOwned")}</span>
                <strong>{stats.totalOwnedItems}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="mr-hero-progress">
          <div className="mr-hero-progress-header">
            <span>
              <RiseOutlined /> {t("mrCalcNextRank", { rank: stats.currentMR + 1 })}
            </span>
            <span className="mr-hero-progress-needed">
              {stats.xpNeededForNext.toLocaleString()} {t("mrCalcXpNeeded")}
            </span>
          </div>
          <Progress
            percent={Math.round(stats.progressInRank)}
            showInfo
            size={["100%", 14]}
            strokeColor={{ from: "color-mix(in srgb, var(--wf-primary) 60%, transparent)", to: "var(--wf-primary)" }}
            trailColor="var(--wf-border)"
            format={(p) => `${p}%`}
          />
        </div>
      </motion.div>

      {/* Breakdown card — only shown when imported (real per-source numbers) */}
      {stats.fromProfile && realBreakdown && (
        <motion.div
          className="mr-calc-breakdown-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="mr-calc-breakdown-title">{t("mrCalcBreakdownTitle")}</div>
          <div className="mr-calc-breakdown-grid">
            <BreakdownRow label={t("mrCalcBreakdownItems")} value={realBreakdown.items} />
            <BreakdownRow
              label={t("mrCalcBreakdownIntrinsics")}
              value={realBreakdown.intrinsics}
              hint={t("mrCalcBreakdownIntrinsicsHint", { ranks: realBreakdown.intrinsicRankTotal })}
            />
            <BreakdownRow
              label={t("mrCalcBreakdownStarChart")}
              value={realBreakdown.starChart}
              hint={t("mrCalcBreakdownStarChartHint", { count: realBreakdown.missionCount })}
            />
            <BreakdownRow label={t("mrCalcBreakdownJunctions")} value={realBreakdown.junctions} />
          </div>
        </motion.div>
      )}

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
