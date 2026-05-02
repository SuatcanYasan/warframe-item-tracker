import { useState, useMemo, useEffect } from "react";
import { Tag, Tooltip, Progress, Segmented } from "antd";
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useTranslate } from "../../hooks/useTranslate";
import { useWfRotationStore, isClaimed } from "../../stores/wfRotationStore";
import {
  getCurrentRotation,
  getUpcomingRotations,
  WF_GROUPS,
} from "../../constants/wfRotation";
import { hideImgOnError } from "../../utils/helpers";

const WF_ICONS = "https://wiki.warframe.com/images";

function warframeIconUrl(name) {
  // Strip whitespace/special chars to match wiki naming convention.
  // e.g. "Mag" -> MagIcon272.png. All current frames use a single token,
  // but we strip spaces defensively for any future multi-word frames.
  const slug = String(name).replace(/\s+/g, "");
  return `${WF_ICONS}/${slug}Icon272.png`;
}

function timeUntil(targetMs, t) {
  const now = Date.now();
  let ms = Math.max(0, targetMs - now);
  const d = Math.floor(ms / 86400000); ms -= d * 86400000;
  const h = Math.floor(ms / 3600000); ms -= h * 3600000;
  const m = Math.floor(ms / 60000);
  if (d > 0) return `${d}${t("wfRotShortDay")} ${h}${t("wfRotShortHour")}`;
  if (h > 0) return `${h}${t("wfRotShortHour")} ${m}${t("wfRotShortMin")}`;
  return `${m}${t("wfRotShortMin")}`;
}

const ROLE_TINTS = {
  Tank:    "#3b82f6",
  DPS:     "#ef4444",
  Support: "#22c55e",
  Stealth: "#a855f7",
};

export default function WFRotationPage() {
  const { t } = useTranslate();
  const claimed = useWfRotationStore((s) => s.claimed);
  const toggleClaim = useWfRotationStore((s) => s.toggleClaim);
  const [view, setView] = useState("upcoming");
  const [, forceTick] = useState(0);

  // Re-render every minute so the countdown stays fresh.
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const { groupIndex, mondayUtc, nextMonday } = useMemo(() => getCurrentRotation(), []);
  const upcoming = useMemo(() => getUpcomingRotations(8), []);
  const currentGroup = WF_GROUPS[groupIndex];

  // Total claimed across all 24 warframes (8 weeks × 3)
  const totalFrames = WF_GROUPS.reduce((sum, g) => sum + g.warframes.length, 0);
  const totalClaimed = WF_GROUPS.reduce((sum, g) => {
    return sum + g.warframes.filter((w) => isClaimed(claimed, g.key, w.name)).length;
  }, 0);
  const overallPct = totalFrames > 0 ? Math.round((totalClaimed / totalFrames) * 100) : 0;

  function WarframePill({ warframe, groupKey, highlight }) {
    const claimedFlag = isClaimed(claimed, groupKey, warframe.name);
    const tint = ROLE_TINTS[warframe.role] || "var(--wf-primary)";
    return (
      <Tooltip title={claimedFlag ? t("wfRotClaimedTooltip") : t("wfRotClickToClaim")}>
        <button
          type="button"
          className={`wfr-warframe ${claimedFlag ? "claimed" : ""} ${highlight ? "highlight" : ""}`}
          onClick={() => toggleClaim(groupKey, warframe.name)}
          aria-pressed={claimedFlag}
          style={{ "--cat-tint": tint }}
        >
          <img
            src={warframeIconUrl(warframe.name)}
            alt=""
            className="wfr-warframe-icon"
            onError={hideImgOnError}
            loading="lazy"
            decoding="async"
          />
          <span className="wfr-warframe-name">{warframe.name}</span>
          <span className="wfr-warframe-role">{warframe.role}</span>
          {claimedFlag && <CheckCircleFilled className="wfr-warframe-check" />}
        </button>
      </Tooltip>
    );
  }

  return (
    <div className="wfr-page">
      <div className="wfr-header">
        <div className="wfr-header-icon">
          <img
            src={`${WF_ICONS}/IconCategoryWarframe%28xWhite%29.png`}
            alt=""
            onError={hideImgOnError}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div>
          <h1 className="wfr-title">{t("wfRotTitle")}</h1>
          <p className="wfr-subtitle">{t("wfRotSubtitle")}</p>
        </div>
      </div>

      {/* Top stat row */}
      <div className="summary-bar wfr-summary">
        <motion.div className="stat-card wfr-current-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="stat-label"><GiftOutlined /> {t("wfRotCurrentWeek")}</div>
          <div className="wfr-current-group">{t("wfRotRotationLabel", { letter: currentGroup.key })}</div>
          <div className="stat-sub">
            {currentGroup.warframes.map((w) => w.name).join(" · ")}
          </div>
        </motion.div>

        <motion.div className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="stat-label"><ClockCircleOutlined /> {t("wfRotNextRotation")}</div>
          <div className="stat-value" style={{ color: "var(--wf-primary)" }}>
            {timeUntil(nextMonday, t)}
          </div>
          <div className="stat-sub">{t("wfRotRotationLabel", { letter: WF_GROUPS[(groupIndex + 1) % WF_GROUPS.length].key })}</div>
        </motion.div>

        <motion.div className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-label">{t("wfRotCollection")}</div>
          <div className="stat-value">{totalClaimed} / {totalFrames}</div>
          <Progress percent={overallPct} showInfo={false} size="small" strokeColor="var(--wf-primary)" trailColor="var(--wf-border)" style={{ marginTop: 8 }} />
        </motion.div>
      </div>

      <Segmented
        block
        value={view}
        onChange={setView}
        options={[
          { label: t("wfRotViewUpcoming"), value: "upcoming" },
          { label: t("wfRotViewAllGroups"), value: "all" },
        ]}
        style={{ margin: "16px 0 14px" }}
      />

      {view === "upcoming" && (
        <div className="wfr-upcoming-grid">
          {upcoming.map((week, i) => {
            const weekClaimedCount = week.group.warframes.filter((w) => isClaimed(claimed, week.group.key, w.name)).length;
            const weekDate = new Date(week.weekStart);
            return (
              <motion.div
                key={i}
                className={`wfr-week-card ${week.isCurrent ? "current" : ""}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="wfr-week-header">
                  <div>
                    <div className="wfr-week-num">
                      {week.isCurrent ? t("wfRotThisWeek") : t("wfRotWeekN", { n: i + 1 })}
                    </div>
                    <div className="wfr-week-date">
                      {weekDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <Tag color={week.isCurrent ? "blue" : "default"} className="wfr-week-tag">
                    {t("wfRotRotationLabel", { letter: week.group.key })}
                  </Tag>
                </div>
                <div className="wfr-week-warframes">
                  {week.group.warframes.map((w) => (
                    <WarframePill
                      key={`${week.group.key}-${w.name}`}
                      warframe={w}
                      groupKey={week.group.key}
                      highlight={week.isCurrent}
                    />
                  ))}
                </div>
                <div className="wfr-week-progress">
                  {weekClaimedCount} / {week.group.warframes.length} {t("wfRotClaimed")}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {view === "all" && (
        <div className="wfr-all-grid">
          {WF_GROUPS.map((group, i) => {
            const groupClaimed = group.warframes.filter((w) => isClaimed(claimed, group.key, w.name)).length;
            const isCurrentGroup = i === groupIndex;
            return (
              <motion.div
                key={group.key}
                className={`wfr-group-card ${isCurrentGroup ? "current" : ""}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="wfr-group-header">
                  <span className="wfr-group-letter">{group.key}</span>
                  <span className="wfr-group-count">{groupClaimed} / {group.warframes.length}</span>
                </div>
                <div className="wfr-group-warframes">
                  {group.warframes.map((w) => (
                    <WarframePill
                      key={`${group.key}-${w.name}`}
                      warframe={w}
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
