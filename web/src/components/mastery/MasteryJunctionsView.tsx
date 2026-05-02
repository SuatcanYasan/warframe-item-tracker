import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useTranslate } from "../../hooks/useTranslate";
import { useJunctionStore } from "../../stores/junctionStore";
import { useMasteryStore } from "../../stores/masteryStore";
import { requestJson } from "../../utils/helpers";
import SkeletonGrid, { SkeletonStatBar } from "../shared/SkeletonGrid";
import ErrorState from "../shared/ErrorState";

interface JunctionDef {
  key: string;
  from: string;
  to: string;
}

interface JunctionsResponse {
  junctions: JunctionDef[];
  xpPerJunction: number;
}

const PLANET_ICON = "https://wiki.warframe.com/images";
// Map "to" planet → wiki icon. Falls back to a generic glyph in the
// component when a planet isn't in this map.
const PLANET_ICONS: Record<string, string> = {
  Venus:   `${PLANET_ICON}/IconVenus.png`,
  Mercury: `${PLANET_ICON}/IconMercury.png`,
  Mars:    `${PLANET_ICON}/IconMars.png`,
  Phobos:  `${PLANET_ICON}/IconPhobos.png`,
  Ceres:   `${PLANET_ICON}/IconCeres.png`,
  Jupiter: `${PLANET_ICON}/IconJupiter.png`,
  Europa:  `${PLANET_ICON}/IconEuropa.png`,
  Saturn:  `${PLANET_ICON}/IconSaturn.png`,
  Uranus:  `${PLANET_ICON}/IconUranus.png`,
  Neptune: `${PLANET_ICON}/IconNeptune.png`,
  Pluto:   `${PLANET_ICON}/IconPluto.png`,
  Sedna:   `${PLANET_ICON}/IconSedna.png`,
  Eris:    `${PLANET_ICON}/IconEris.png`,
  Lua:     `${PLANET_ICON}/IconLua.png`,
};

export default function MasteryJunctionsView() {
  const { t } = useTranslate();
  const completed = useJunctionStore((s) => s.completed);
  const toggle = useJunctionStore((s) => s.toggle);
  const mode = useMasteryStore((s) => s.mode);

  const [data, setData] = useState<JunctionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    requestJson<JunctionsResponse>("/api/mastery/junctions")
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    if (!data) return { done: 0, total: 0, xp: 0 };
    const done = data.junctions.filter((j) => completed[j.key]).length;
    return { done, total: data.junctions.length, xp: done * data.xpPerJunction };
  }, [data, completed]);

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

  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const possibleXp = stats.total * data.xpPerJunction;

  return (
    <>
      <div className="summary-bar mastery-summary-grid">
        <motion.div className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="stat-label">{t("masteryJunctionsCompleted")}</div>
          <div className="stat-value" style={{ color: "var(--wf-primary)" }}>
            {stats.done}<span className="mr-calc-stat-of"> / {stats.total}</span>
          </div>
          <div className="summary-progress-bar">
            <div className="summary-progress-fill cyan" style={{ width: `${pct}%` }} />
          </div>
        </motion.div>
        <motion.div className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="stat-label">{t("masteryJunctionsXp")}</div>
          <div className="stat-value">{stats.xp.toLocaleString()}<span className="mr-calc-stat-of"> / {possibleXp.toLocaleString()}</span></div>
          <div className="stat-sub">{data.xpPerJunction} XP {t("masteryJunctionsEach")}</div>
        </motion.div>
      </div>

      {mode === "sync" && (
        <div className="mastery-readonly-hint">{t("masteryJunctionsSyncHint")}</div>
      )}

      <div className="mastery-grid junction-grid">
        <AnimatePresence>
          {data.junctions.map((j) => {
            const done = !!completed[j.key];
            const icon = PLANET_ICONS[j.to];
            const hint = mode === "sync"
              ? (done ? t("masteryJunctionsDone") : t("masteryJunctionsTodo"))
              : (done ? t("masteryClickReset") : t("masteryClickDone"));
            return (
              <motion.div
                key={j.key}
                className={`mastery-card junction-card ${done ? "mastered" : ""}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                onClick={() => mode === "manual" && toggle(j.key)}
                style={{ cursor: mode === "manual" ? "pointer" : "default" }}
              >
                <div className="mastery-card-hover-hint">{hint}</div>
                <div className="mastery-card-img-wrap">
                  {icon ? (
                    <img src={icon} alt={j.to} className="mastery-card-img" loading="lazy" />
                  ) : (
                    <div className="mastery-card-img-placeholder" />
                  )}
                  {done && (
                    <div className="mastery-card-badge mastered-badge">
                      <CheckOutlined />
                    </div>
                  )}
                </div>
                <div className="mastery-card-name junction-card-name">
                  <span className="junction-from">{j.from}</span>
                  <ArrowRightOutlined className="junction-arrow" />
                  <span className="junction-to">{j.to}</span>
                </div>
                <div className="mastery-card-type">{t("masteryJunctionsRoute")}</div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}
