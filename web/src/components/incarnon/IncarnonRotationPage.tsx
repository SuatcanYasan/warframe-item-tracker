import { useState, useMemo, useEffect } from "react";
import { Tag, Tooltip, Progress, Segmented } from "antd";
import {
  CheckCircleFilled,
  ThunderboltFilled,
  ClockCircleOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useTranslate } from "../../hooks/useTranslate";
import type { TranslateFn } from "../../hooks/useTranslate";
import { useIncarnonStore, isClaimed } from "../../stores/incarnonStore";
import {
  getCurrentRotation,
  getUpcomingRotations,
  INCARNON_GROUPS,
} from "../../constants/incarnonRotation";
import type { IncarnonWeapon } from "../../constants/incarnonRotation";

function timeUntil(targetMs: number, t: TranslateFn): string {
  const now = Date.now();
  let ms = Math.max(0, targetMs - now);
  const d = Math.floor(ms / 86400000); ms -= d * 86400000;
  const h = Math.floor(ms / 3600000); ms -= h * 3600000;
  const m = Math.floor(ms / 60000);
  if (d > 0) return `${d}${t("incShortDay")} ${h}${t("incShortHour")}`;
  if (h > 0) return `${h}${t("incShortHour")} ${m}${t("incShortMin")}`;
  return `${m}${t("incShortMin")}`;
}

const CATEGORY_TINTS: Record<string, string> = {
  Primary:   "var(--wf-primary)",
  Secondary: "#3b82f6",
  Melee:     "#ef4444",
};

type ViewMode = "upcoming" | "all";

export default function IncarnonRotationPage() {
  const { t } = useTranslate();
  const claimed = useIncarnonStore((s) => s.claimed);
  const toggleClaim = useIncarnonStore((s) => s.toggleClaim);
  const [view, setView] = useState<ViewMode>("upcoming");
  const [, forceTick] = useState<number>(0);

  // Re-render every minute so the countdown stays fresh.
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const { groupIndex, nextMonday } = useMemo(() => getCurrentRotation(), []);
  const upcoming = useMemo(() => getUpcomingRotations(8), []);
  const currentGroup = INCARNON_GROUPS[groupIndex];

  // Total claimed across all 40 weapons
  const totalWeapons = INCARNON_GROUPS.reduce((sum, g) => sum + g.weapons.length, 0);
  const totalClaimed = INCARNON_GROUPS.reduce((sum, g) => {
    return sum + g.weapons.filter((w) => isClaimed(claimed, g.key, w.name)).length;
  }, 0);
  const overallPct = totalWeapons > 0 ? Math.round((totalClaimed / totalWeapons) * 100) : 0;

  interface WeaponPillProps {
    weapon: IncarnonWeapon;
    groupKey: string;
    highlight?: boolean;
  }

  function WeaponPill({ weapon, groupKey, highlight }: WeaponPillProps) {
    const claimedFlag = isClaimed(claimed, groupKey, weapon.name);
    const tint = CATEGORY_TINTS[weapon.category] || "var(--wf-primary)";
    return (
      <Tooltip title={claimedFlag ? t("incClaimedTooltip") : t("incClickToClaim")}>
        <button
          type="button"
          className={`incarnon-weapon ${claimedFlag ? "claimed" : ""} ${highlight ? "highlight" : ""}`}
          onClick={() => toggleClaim(groupKey, weapon.name)}
          aria-pressed={claimedFlag}
          style={{ ["--cat-tint" as any]: tint }}
        >
          <span className="incarnon-weapon-name">{weapon.name}</span>
          <span className="incarnon-weapon-cat">{weapon.category}</span>
          {claimedFlag && <CheckCircleFilled className="incarnon-weapon-check" />}
        </button>
      </Tooltip>
    );
  }

  return (
    <div className="incarnon-page">
      <div className="incarnon-header">
        <div className="incarnon-header-icon"><ThunderboltFilled /></div>
        <div>
          <h1 className="incarnon-title">{t("incTitle")}</h1>
          <p className="incarnon-subtitle">{t("incSubtitle")}</p>
        </div>
      </div>

      {/* Top stat row */}
      <div className="summary-bar incarnon-summary">
        <motion.div className="stat-card incarnon-current-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="stat-label"><GiftOutlined /> {t("incCurrentWeek")}</div>
          <div className="incarnon-current-group">{t("incRotationLabel", { letter: currentGroup.key })}</div>
          <div className="stat-sub">
            {currentGroup.weapons.map((w) => w.name).join(" · ")}
          </div>
        </motion.div>

        <motion.div className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="stat-label"><ClockCircleOutlined /> {t("incNextRotation")}</div>
          <div className="stat-value" style={{ color: "var(--wf-primary)" }}>
            {timeUntil(nextMonday, t)}
          </div>
          <div className="stat-sub">{t("incRotationLabel", { letter: INCARNON_GROUPS[(groupIndex + 1) % INCARNON_GROUPS.length].key })}</div>
        </motion.div>

        <motion.div className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-label">{t("incCollection")}</div>
          <div className="stat-value">{totalClaimed} / {totalWeapons}</div>
          <Progress percent={overallPct} showInfo={false} size="small" strokeColor="var(--wf-primary)" trailColor="var(--wf-border)" style={{ marginTop: 8 }} />
        </motion.div>
      </div>

      <Segmented
        block
        value={view}
        onChange={(v) => setView(v as ViewMode)}
        options={[
          { label: t("incViewUpcoming"), value: "upcoming" },
          { label: t("incViewAllGroups"), value: "all" },
        ]}
        style={{ margin: "16px 0 14px" }}
      />

      {view === "upcoming" && (
        <div className="incarnon-upcoming-grid">
          {upcoming.map((week, i) => {
            const weekClaimedCount = week.group.weapons.filter((w) => isClaimed(claimed, week.group.key, w.name)).length;
            const weekDate = new Date(week.weekStart);
            return (
              <motion.div
                key={i}
                className={`incarnon-week-card ${week.isCurrent ? "current" : ""}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="incarnon-week-header">
                  <div>
                    <div className="incarnon-week-num">
                      {week.isCurrent ? t("incThisWeek") : t("incWeekN", { n: i + 1 })}
                    </div>
                    <div className="incarnon-week-date">
                      {weekDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <Tag color={week.isCurrent ? "gold" : "default"} className="incarnon-week-tag">
                    {t("incRotationLabel", { letter: week.group.key })}
                  </Tag>
                </div>
                <div className="incarnon-week-weapons">
                  {week.group.weapons.map((w) => (
                    <WeaponPill
                      key={`${week.group.key}-${w.name}`}
                      weapon={w}
                      groupKey={week.group.key}
                      highlight={week.isCurrent}
                    />
                  ))}
                </div>
                <div className="incarnon-week-progress">
                  {weekClaimedCount} / {week.group.weapons.length} {t("incClaimed")}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {view === "all" && (
        <div className="incarnon-all-grid">
          {INCARNON_GROUPS.map((group, i) => {
            const groupClaimed = group.weapons.filter((w) => isClaimed(claimed, group.key, w.name)).length;
            const isCurrentGroup = i === groupIndex;
            return (
              <motion.div
                key={group.key}
                className={`incarnon-group-card ${isCurrentGroup ? "current" : ""}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="incarnon-group-header">
                  <span className="incarnon-group-letter">{group.key}</span>
                  <span className="incarnon-group-count">{groupClaimed} / {group.weapons.length}</span>
                </div>
                <div className="incarnon-group-weapons">
                  {group.weapons.map((w) => (
                    <WeaponPill
                      key={`${group.key}-${w.name}`}
                      weapon={w}
                      groupKey={group.key}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
