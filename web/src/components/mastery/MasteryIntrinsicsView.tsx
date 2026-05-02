import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button, Progress } from "antd";
import { PlusOutlined, MinusOutlined } from "@ant-design/icons";
import { useTranslate } from "../../hooks/useTranslate";
import { useIntrinsicStore } from "../../stores/intrinsicStore";
import { useMasteryStore } from "../../stores/masteryStore";
import { requestJson } from "../../utils/helpers";
import SkeletonGrid, { SkeletonStatBar } from "../shared/SkeletonGrid";
import ErrorState from "../shared/ErrorState";

interface IntrinsicDef {
  key: string;
  category: "railjack" | "drifter";
  maxRank: number;
}

interface IntrinsicsResponse {
  intrinsics: IntrinsicDef[];
  xpPerRank: number;
}

const CATEGORY_ORDER: ("railjack" | "drifter")[] = ["railjack", "drifter"];

export default function MasteryIntrinsicsView() {
  const { t } = useTranslate();
  const ranks = useIntrinsicStore((s) => s.ranks);
  const setRank = useIntrinsicStore((s) => s.setRank);
  const mode = useMasteryStore((s) => s.mode);

  const [data, setData] = useState<IntrinsicsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    requestJson<IntrinsicsResponse>("/api/mastery/intrinsics")
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const grouped = useMemo(() => {
    const out: Record<string, IntrinsicDef[]> = { railjack: [], drifter: [] };
    if (!data) return out;
    for (const it of data.intrinsics) (out[it.category] ||= []).push(it);
    return out;
  }, [data]);

  const stats = useMemo(() => {
    if (!data) return { total: 0, max: 0, xp: 0, possibleXp: 0 };
    let total = 0;
    let max = 0;
    for (const def of data.intrinsics) {
      total += ranks[def.key] || 0;
      max += def.maxRank;
    }
    return { total, max, xp: total * data.xpPerRank, possibleXp: max * data.xpPerRank };
  }, [data, ranks]);

  if (loading) {
    return (
      <>
        <SkeletonStatBar count={3} />
        <SkeletonGrid variant="card" count={6} />
      </>
    );
  }
  if (error || !data) {
    return <ErrorState title={t("errorMasteryTitle")} description={t("errorMasteryDesc")} />;
  }

  const totalPct = stats.max > 0 ? Math.round((stats.total / stats.max) * 100) : 0;

  return (
    <>
      <div className="summary-bar mastery-summary-grid">
        <motion.div className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="stat-label">{t("masteryIntrinsicsTotalRank")}</div>
          <div className="stat-value" style={{ color: "var(--wf-primary)" }}>
            {stats.total}<span className="mr-calc-stat-of"> / {stats.max}</span>
          </div>
          <div className="summary-progress-bar">
            <div className="summary-progress-fill cyan" style={{ width: `${totalPct}%` }} />
          </div>
        </motion.div>
        <motion.div className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="stat-label">{t("masteryIntrinsicsXp")}</div>
          <div className="stat-value">{stats.xp.toLocaleString()}<span className="mr-calc-stat-of"> / {stats.possibleXp.toLocaleString()}</span></div>
          <div className="stat-sub">{data.xpPerRank} XP {t("masteryIntrinsicsPerRank")}</div>
        </motion.div>
      </div>

      {mode === "sync" && (
        <div className="mastery-readonly-hint">{t("masteryIntrinsicsSyncHint")}</div>
      )}

      <div className="mastery-sections">
        {CATEGORY_ORDER.map((cat) => (
          <div key={cat} className="mastery-category">
            <div className="mastery-category-header">
              <span className="mastery-category-title">{t(`masteryIntrinsicsCategory_${cat}`)}</span>
              <span className="mastery-category-count">
                {(grouped[cat] || []).reduce((acc, d) => acc + (ranks[d.key] || 0), 0)}
                /
                {(grouped[cat] || []).reduce((acc, d) => acc + d.maxRank, 0)}
              </span>
            </div>
            <div className="intrinsic-grid">
              {(grouped[cat] || []).map((def) => {
                const rank = ranks[def.key] || 0;
                const pct = Math.round((rank / def.maxRank) * 100);
                return (
                  <div key={def.key} className="intrinsic-card">
                    <div className="intrinsic-card-header">
                      <span className="intrinsic-card-name">{t(`masteryIntrinsics_${def.key}`)}</span>
                      <span className="intrinsic-card-rank">{rank}<span className="intrinsic-card-of">/{def.maxRank}</span></span>
                    </div>
                    <Progress
                      percent={pct}
                      showInfo={false}
                      size="small"
                      strokeColor="var(--wf-primary)"
                      trailColor="var(--wf-border)"
                    />
                    {mode === "manual" && (
                      <div className="intrinsic-card-controls">
                        <Button
                          size="small"
                          icon={<MinusOutlined />}
                          disabled={rank <= 0}
                          onClick={() => setRank(def.key, rank - 1)}
                          aria-label="-1"
                        />
                        <Button
                          size="small"
                          icon={<PlusOutlined />}
                          disabled={rank >= def.maxRank}
                          onClick={() => setRank(def.key, rank + 1)}
                          aria-label="+1"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
