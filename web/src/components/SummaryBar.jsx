import { useMemo } from "react";
import { motion } from "framer-motion";

export default function SummaryBar({ t, selectedItems, adjustedTotals }) {
  const stats = useMemo(() => {
    const total = adjustedTotals.length;
    const done = adjustedTotals.filter((r) => r.status === "done").length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    const totalCredits = selectedItems.reduce((sum, item) => sum + ((item.buildPrice || 0) * (item.quantity || 1)), 0);
    return { tracking: selectedItems.length, done, total, percent, totalCredits };
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
        className="stat-card gold"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="stat-label">{t("overallProgress")}</div>
        <div className="stat-value">%{stats.percent}</div>
        <div className="summary-progress-bar">
          <div className="summary-progress-fill gold" style={{ width: `${stats.percent}%` }} />
        </div>
      </motion.div>

      <motion.div
        className="stat-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="stat-label">{t("totalCredits")}</div>
        <div className="stat-value" style={{ color: "var(--accent-gold, #d4a843)" }}>
          {stats.totalCredits.toLocaleString()}
        </div>
        <div className="stat-sub">Credits</div>
      </motion.div>
    </div>
  );
}
