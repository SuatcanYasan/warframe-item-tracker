import { useMemo } from "react";
import { Empty, Progress } from "antd";
import { useTranslate } from "../../../hooks/useTranslate";

interface InvasionReward {
  countedItems?: Array<{ count: number; type: string }>;
  credits?: number;
}

interface InvasionSide {
  faction?: string;
  factionKey?: string;
  reward?: InvasionReward | null;
}

interface Invasion {
  id: string;
  completed?: boolean;
  completion?: number;
  attacker?: InvasionSide;
  defender?: InvasionSide;
  attackingFaction?: string;
  defendingFaction?: string;
  attackerReward?: InvasionReward | null;
  defenderReward?: InvasionReward | null;
  node?: string;
  desc?: string;
  eta?: string;
}

interface Props {
  invasions: Invasion[];
}

function rewardText(reward: InvasionReward | null | undefined): string {
  if (!reward) return "";
  const items = (reward.countedItems || []).map((c) => `${c.count}× ${c.type}`);
  if (reward.credits) items.push(`${reward.credits.toLocaleString()} cr`);
  return items.join(", ");
}

function factionOf(side: InvasionSide | undefined): string {
  // WarframeStatus wraps both sides: { faction, reward } — fallbacks for old flat shape.
  return side?.faction || side?.factionKey || "";
}

function rewardOf(side: InvasionSide | undefined): InvasionReward | null {
  return side?.reward || null;
}

export default function InvasionsTab({ invasions }: Props) {
  const { t } = useTranslate();
  const active = useMemo(
    () => invasions.filter((i) => !i.completed),
    [invasions],
  );

  if (active.length === 0) return <Empty description={t("actNoneActive")} />;

  return (
    <div className="activity-grid">
      {active.map((inv) => {
        const pct = typeof inv.completion === "number" ? Math.abs(Math.round(inv.completion)) : 0;
        const winning = (inv.completion || 0) > 0 ? "attacker" : "defender";
        const attFaction = factionOf(inv.attacker) || inv.attackingFaction;
        const defFaction = factionOf(inv.defender) || inv.defendingFaction;
        const attReward = rewardOf(inv.attacker) || inv.attackerReward;
        const defReward = rewardOf(inv.defender) || inv.defenderReward;
        return (
          <div key={inv.id} className="activity-card invasion-card">
            <div className="activity-card-header">
              <span className="activity-card-title">{inv.node}</span>
            </div>
            {inv.desc && <div className="activity-card-desc">{inv.desc}</div>}
            <div className="invasion-factions">
              <div className={`invasion-side ${winning === "attacker" ? "winning" : ""}`}>
                <div className="invasion-side-name">{attFaction || "—"}</div>
                <div className="invasion-side-reward">{rewardText(attReward) || "—"}</div>
              </div>
              <div className="invasion-vs">VS</div>
              <div className={`invasion-side ${winning === "defender" ? "winning" : ""}`}>
                <div className="invasion-side-name">{defFaction || "—"}</div>
                <div className="invasion-side-reward">{rewardText(defReward) || "—"}</div>
              </div>
            </div>
            <Progress
              percent={pct}
              showInfo
              size="small"
              strokeColor="var(--wf-primary)"
              trailColor="var(--wf-border)"
              format={(v) => `${v}% ${winning === "attacker" ? "→" : "←"}`}
            />
            {inv.eta && <div className="activity-card-eta">ETA: {inv.eta}</div>}
          </div>
        );
      })}
    </div>
  );
}
