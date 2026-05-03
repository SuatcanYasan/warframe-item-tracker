import { useMemo, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { useTranslate } from "../../hooks/useTranslate";
import { useCraftStore } from "../../stores/craftStore";
import type { AdjustedTotal } from "../../hooks/useCraftDerived";

// Lazy-loaded so recharts (~80 KB gzip) isn't pulled into the entry
// bundle. Donut renders an instant after the rest of the bar.
const ProgressDonut = lazy(() => import("../shared/ProgressDonut"));

interface Props {
  adjustedTotals: AdjustedTotal[];
}

export default function SummaryBar({ adjustedTotals }: Props) {
  const { t } = useTranslate();
  const selectedItems = useCraftStore((s) => s.selectedItems);
  const stats = useMemo(() => {
    const total = adjustedTotals.length;
    const done = adjustedTotals.filter((r) => r.status === "done").length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { tracking: selectedItems.length, done, total, percent };
  }, [selectedItems, adjustedTotals]);

  return (
    <div className="summary-bar">
      <motion.div
        className="stat-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
      >
        <div className="stat-label">{t("selected")}</div>
        <div className="stat-value">{stats.tracking}</div>
        <div className="stat-sub">{t("trackingItems", { count: stats.tracking })}</div>
      </motion.div>

      <motion.div
        className="stat-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="stat-label">{t("resourceTotals")}</div>
        <div className="stat-value">{stats.done} / {stats.total}</div>
        <div className="summary-progress-bar">
          <div className="summary-progress-fill cyan" style={{ width: `${stats.percent}%` }} />
        </div>
      </motion.div>

      <motion.div
        className="stat-card gold stat-card-donut"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="stat-label">{t("overallProgress")}</div>
          <div className="stat-value">{stats.done} / {stats.total}</div>
          <div className="stat-sub">%{stats.percent}</div>
        </div>
        <Suspense fallback={<div style={{ width: 72, height: 72 }} />}>
          <ProgressDonut percent={stats.percent} />
        </Suspense>
      </motion.div>

    </div>
  );
}
