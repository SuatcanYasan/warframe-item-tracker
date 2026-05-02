import { useMemo, useState } from "react";
import { Segmented, Empty } from "antd";
import { Countdown } from "../useCountdown";
import { useTranslate } from "../../../hooks/useTranslate";

interface Fissure {
  id: string;
  tier: string;
  tierNum?: number;
  expiry: string | number | Date;
  isStorm?: boolean;
  isHard?: boolean;
  missionType: string;
  node: string;
  enemy: string;
}

interface Props {
  fissures: Fissure[];
}

type FilterMode = "all" | "storm" | "steel" | "normal";

const TIER_COLORS: Record<string, string> = {
  Lith: "#8B5E3C",
  Meso: "#6B7280",
  Neo: "#F59E0B",
  Axi: "#EF4444",
  Requiem: "#A855F7",
  Omnia: "#06B6D4",
};

export default function FissuresTab({ fissures }: Props) {
  const { t } = useTranslate();
  const [filter, setFilter] = useState<FilterMode>("all");

  const filtered = useMemo(() => {
    const active = fissures.filter((f) => new Date(f.expiry).getTime() > Date.now());
    if (filter === "storm") return active.filter((f) => f.isStorm);
    if (filter === "steel") return active.filter((f) => f.isHard);
    if (filter === "normal") return active.filter((f) => !f.isStorm && !f.isHard);
    return active;
  }, [fissures, filter]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => (a.tierNum || 0) - (b.tierNum || 0)),
    [filtered],
  );

  return (
    <div className="activities-list-wrap">
      <Segmented
        value={filter}
        onChange={(v) => setFilter(v as FilterMode)}
        options={[
          { value: "all", label: t("actAll") },
          { value: "normal", label: t("actNormal") },
          { value: "steel", label: t("actSteelPath") },
          { value: "storm", label: t("actVoidStorm") },
        ]}
      />
      {sorted.length === 0 ? (
        <Empty description={t("actNoneActive")} />
      ) : (
        <div className="activity-grid">
          {sorted.map((f) => (
            <div key={f.id} className="activity-card">
              <div className="activity-card-header">
                <span
                  className="activity-tier-pill"
                  style={{
                    background: `color-mix(in srgb, ${TIER_COLORS[f.tier] || "#555"} 18%, var(--wf-bg-base))`,
                    borderColor: `color-mix(in srgb, ${TIER_COLORS[f.tier] || "#555"} 50%, transparent)`,
                    color: TIER_COLORS[f.tier] || "var(--wf-text)",
                  }}
                >
                  {f.tier}
                </span>
                <Countdown expiry={f.expiry} className="activity-countdown" />
              </div>
              <div className="activity-card-title">{f.missionType}</div>
              <div className="activity-card-node">{f.node}</div>
              <div className="activity-card-meta">
                <span>{f.enemy}</span>
                {f.isHard && <span className="activity-tag steel">{t("actSteelPath")}</span>}
                {f.isStorm && <span className="activity-tag storm">{t("actVoidStorm")}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
