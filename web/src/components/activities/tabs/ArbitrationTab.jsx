import { Empty, Tag } from "antd";
import { Countdown } from "../useCountdown";
import { useTranslate } from "../../../hooks/useTranslate";

export default function ArbitrationTab({ arbitration }) {
  const { t } = useTranslate();
  if (!arbitration || !arbitration.expiry) {
    return <Empty description={t("actArbitrationInactive")} />;
  }

  const isActive = new Date(arbitration.expiry).getTime() > Date.now();
  const factionColor = {
    Grineer: "#8B4513",
    Corpus: "#3B82F6",
    Infested: "#06B6D4",
  }[arbitration.enemy] || "default";

  return (
    <div className="arbitration-wrap">
      <div className="arbitration-card">
        <div className="arbitration-header">
          <div>
            <div className="arbitration-title">{t("actArbitrationTitle")}</div>
            <div className="arbitration-node">{arbitration.node}</div>
          </div>
          <Countdown expiry={arbitration.expiry} className="activity-countdown-large" />
        </div>
        <div className="arbitration-meta">
          <div className="arbitration-meta-item">
            <span>{t("actMission")}</span>
            <b>{arbitration.type}</b>
          </div>
          <div className="arbitration-meta-item">
            <span>{t("actEnemy")}</span>
            <b><Tag color={factionColor}>{arbitration.enemy}</Tag></b>
          </div>
          {arbitration.isArchwing && (
            <div className="arbitration-meta-item">
              <Tag color="cyan">Archwing</Tag>
            </div>
          )}
        </div>
        <p className="arbitration-hint">{t("actArbitrationHint")}</p>
      </div>
    </div>
  );
}
