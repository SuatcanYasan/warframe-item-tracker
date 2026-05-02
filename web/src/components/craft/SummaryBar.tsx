import { useMemo } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useTranslate } from "../../hooks/useTranslate";
import { useCraftStore } from "../../stores/craftStore";
import type { AdjustedTotal } from "../../hooks/useCraftDerived";

interface DonutProps {
  percent: number;
}

function ProgressDonut({ percent }: DonutProps) {
  const data = [
    { name: "done", value: Math.max(0, Math.min(100, percent)) },
    { name: "remaining", value: 100 - Math.max(0, Math.min(100, percent)) },
  ];
  return (
    <div style={{ width: 72, height: 72, position: "relative" }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={24}
            outerRadius={34}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            isAnimationActive
          >
            <Cell fill="var(--wf-primary)" />
            <Cell fill="color-mix(in srgb, var(--wf-text) 10%, transparent)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 700,
          color: "var(--wf-primary)",
          fontFamily: "var(--font-mono, monospace)",
        }}
      >
        %{percent}
      </div>
    </div>
  );
}

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
        <ProgressDonut percent={stats.percent} />
      </motion.div>

    </div>
  );
}
