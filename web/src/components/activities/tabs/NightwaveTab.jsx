import { Empty, Tag } from "antd";
import { Countdown } from "../useCountdown";
import { useTranslate } from "../../../hooks/useTranslate";

export default function NightwaveTab({ nightwave }) {
  const { t } = useTranslate();
  if (!nightwave || !Array.isArray(nightwave.activeChallenges)) {
    return <Empty description={t("actNightwaveInactive")} />;
  }

  const challenges = nightwave.activeChallenges.filter(
    (c) => !c.expiry || new Date(c.expiry).getTime() > Date.now(),
  );

  const dailies = challenges.filter((c) => c.isDaily);
  const weeklies = challenges.filter((c) => !c.isDaily && !c.isElite);
  const elites = challenges.filter((c) => c.isElite);

  function renderGroup(list, label, color) {
    if (list.length === 0) return null;
    return (
      <div className="nightwave-group">
        <h3 className="activities-section-title">
          {label} <span className="activities-section-count">{list.length}</span>
        </h3>
        <div className="activity-grid">
          {list.map((c) => (
            <div key={c.id} className="activity-card nightwave-challenge">
              <div className="activity-card-header">
                <Tag color={color}>{c.reputation} {t("actStanding")}</Tag>
                {c.expiry && <Countdown expiry={c.expiry} className="activity-countdown" />}
              </div>
              <div className="activity-card-title">{c.title}</div>
              <div className="activity-card-desc">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="nightwave-wrap">
      {nightwave.season != null && (
        <div className="nightwave-season-banner">
          {t("actNightwaveSeason")} {nightwave.season} · Phase {nightwave.phase ?? 0}
          {nightwave.expiry && <> · <Countdown expiry={nightwave.expiry} /></>}
        </div>
      )}
      {renderGroup(dailies, t("actDaily"), "blue")}
      {renderGroup(weeklies, t("actWeekly"), "gold")}
      {renderGroup(elites, t("actEliteWeekly"), "magenta")}
    </div>
  );
}
