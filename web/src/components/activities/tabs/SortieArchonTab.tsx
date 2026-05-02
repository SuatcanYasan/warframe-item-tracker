import { Empty, Tag } from "antd";
import { Countdown } from "../useCountdown";
import { useTranslate } from "../../../hooks/useTranslate";
import type { TranslateFn } from "../../../hooks/useTranslate";

interface Mission {
  missionType?: string;
  node?: string;
  modifier?: string;
  modifierDescription?: string;
}

interface SortieArchonData {
  variants?: Mission[];
  missions?: Mission[];
  faction?: string;
  boss?: string;
  expiry?: string | number | Date | null;
  rewardPool?: string;
}

interface CardProps {
  data: SortieArchonData | null | undefined;
  title: string;
  kind: "sortie" | "archon";
  t: TranslateFn;
}

const FACTION_COLORS: Record<string, string> = {
  Grineer: "#8B4513",
  Corpus: "#3B82F6",
  Infested: "#06B6D4",
  Corrupted: "#CA8A04",
  Sentient: "#A855F7",
};

function HighEndCard({ data, title, kind, t }: CardProps) {
  if (!data) {
    return <Empty description={t("actNoneActive")} />;
  }
  const missions = data.variants || data.missions || [];
  const factionColor = (data.faction && FACTION_COLORS[data.faction]) || "default";

  return (
    <div className="sortie-archon-card">
      <div className="sortie-archon-header">
        <div>
          <div className="sortie-archon-title">{title}</div>
          <div className="sortie-archon-boss">
            {data.boss} <Tag color={factionColor}>{data.faction}</Tag>
          </div>
        </div>
        {data.expiry && <Countdown expiry={data.expiry} className="activity-countdown" />}
      </div>

      <div className="sortie-missions">
        {missions.map((m, i) => (
          <div key={i} className="sortie-mission">
            <div className="sortie-mission-num">{i + 1}</div>
            <div className="sortie-mission-info">
              <div className="sortie-mission-type">
                {m.missionType}
                {m.node && <span className="sortie-mission-node"> — {m.node}</span>}
              </div>
              {m.modifier && <div className="sortie-mission-modifier">⚡ {m.modifier}</div>}
              {m.modifierDescription && (
                <div className="sortie-mission-desc">{m.modifierDescription}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {kind === "archon" && data.rewardPool && (
        <div className="sortie-archon-reward">
          <strong>{t("actReward")}:</strong> {data.rewardPool}
        </div>
      )}
    </div>
  );
}

interface Props {
  sortie: SortieArchonData | null | undefined;
  archonHunt: SortieArchonData | null | undefined;
}

export default function SortieArchonTab({ sortie, archonHunt }: Props) {
  const { t } = useTranslate();
  return (
    <div className="sortie-archon-grid">
      <HighEndCard data={sortie} title={t("actSortieTitle")} kind="sortie" t={t} />
      <HighEndCard data={archonHunt} title={t("actArchonHuntTitle")} kind="archon" t={t} />
    </div>
  );
}
