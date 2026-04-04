import { Typography } from "antd";
import RelicCardGrid from "./RelicCardGrid";

const { Text } = Typography;

export default function RelicTrackerContent({
  t, tin, watchedPrimes, foundComponents, onToggleFound,
}) {
  return (
    <>
      <div className="content-header">
        <div className="content-tabs">
          <span className="content-tab active" style={{ cursor: "default" }}>
            {t("watchedPrimes")} <span className="content-tab-badge">{watchedPrimes.length}</span>
          </span>
        </div>
        <div className="content-actions">
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t("relicAutoSyncHint")}
          </Text>
        </div>
      </div>

      <RelicCardGrid
        t={t}
        tin={tin}
        watchedPrimes={watchedPrimes}
        foundComponents={foundComponents}
        onToggleFound={onToggleFound}
        onRemovePrime={() => {}}
      />
    </>
  );
}
