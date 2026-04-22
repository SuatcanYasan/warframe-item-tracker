import { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckOutlined, StarFilled } from "@ant-design/icons";
import { FALLBACK_ICON, handleImgError } from "../../../utils/helpers";
import { useTranslate } from "../../../hooks/useTranslate";
import { useAmpStore } from "../../../stores/ampStore";

function AmpCard({ part, status, onCycle, t }) {
  const label = status === "gilded" ? t("ampStatusGilded")
    : status === "owned" ? t("ampStatusOwned")
    : t("ampStatusMissing");

  return (
    <motion.button
      type="button"
      className={`amp-card amp-card-${status || "none"}`}
      onClick={() => onCycle(part.uniqueName)}
      layout
      whileTap={{ scale: 0.96 }}
    >
      <div className="amp-card-badge">
        {part.number === 0 ? "M" : part.number}
      </div>
      {status === "gilded" && (
        <div className="amp-card-gild-icon" title={t("ampStatusGilded")}>
          <StarFilled />
        </div>
      )}
      {status === "owned" && (
        <div className="amp-card-owned-icon" title={t("ampStatusOwned")}>
          <CheckOutlined />
        </div>
      )}
      <img
        src={part.imageUrl || FALLBACK_ICON}
        alt=""
        className="amp-card-img"
        onError={handleImgError} loading="lazy" decoding="async" />
      <div className="amp-card-name">{part.name}</div>
      <div className="amp-card-slot">{part.slot}</div>
      <div className="amp-card-status">{label}</div>
    </motion.button>
  );
}

function Section({ title, parts, masteryParts, onCycle, t }) {
  return (
    <div className="amp-section">
      <h3 className="amp-section-title">
        {title}
        <span className="amp-section-count">{parts.length}</span>
      </h3>
      <div className="amp-grid">
        {parts.map((part) => (
          <AmpCard
            key={part.uniqueName}
            part={part}
            status={masteryParts[part.uniqueName]}
            onCycle={onCycle}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

export default function AmpMasteryTab({ allParts }) {
  const { t } = useTranslate();
  const masteryParts = useAmpStore((s) => s.masteryParts);
  const cycleMasteryStatus = useAmpStore((s) => s.cycleMasteryStatus);

  const prisms = useMemo(
    () => allParts.filter((p) => p.slot === "prism").sort((a, b) => a.number - b.number),
    [allParts],
  );
  const scaffolds = useMemo(
    () => allParts.filter((p) => p.slot === "scaffold").sort((a, b) => a.number - b.number),
    [allParts],
  );
  const braces = useMemo(
    () => allParts.filter((p) => p.slot === "brace").sort((a, b) => a.number - b.number),
    [allParts],
  );

  const totalOwned = Object.values(masteryParts).filter((s) => s === "owned").length;
  const totalGilded = Object.values(masteryParts).filter((s) => s === "gilded").length;
  const totalAll = allParts.length;
  const mrFromGilded = totalGilded * 3000;
  const pct = totalAll > 0 ? Math.round(((totalOwned + totalGilded) / totalAll) * 100) : 0;

  function handleCycle(uniqueName) {
    const content = document.querySelector(".app-content");
    const scrollTop = content?.scrollTop || 0;
    cycleMasteryStatus(uniqueName);
    requestAnimationFrame(() => {
      if (content) content.scrollTop = scrollTop;
    });
  }

  return (
    <div className="amp-tracker">
      <div className="amp-tracker-stats">
        <div className="amp-stat">
          <div className="amp-stat-value">{totalAll}</div>
          <div className="amp-stat-label">{t("ampStatTotal")}</div>
        </div>
        <div className="amp-stat amp-stat-owned">
          <div className="amp-stat-value">{totalOwned}</div>
          <div className="amp-stat-label">{t("ampStatusOwned")}</div>
        </div>
        <div className="amp-stat amp-stat-gilded">
          <div className="amp-stat-value">{totalGilded}</div>
          <div className="amp-stat-label">{t("ampStatusGilded")}</div>
        </div>
        <div className="amp-stat amp-stat-pct">
          <div className="amp-stat-value">%{pct}</div>
          <div className="amp-stat-label">{t("ampStatProgress")}</div>
        </div>
        <div className="amp-stat amp-stat-mr">
          <div className="amp-stat-value">{mrFromGilded.toLocaleString()}</div>
          <div className="amp-stat-label">{t("ampStatMastery")}</div>
        </div>
      </div>

      <p className="amp-tracker-hint">{t("ampTrackerHint")}</p>

      <Section title={t("ampPrisms")} parts={prisms} masteryParts={masteryParts} onCycle={handleCycle} t={t} />
      <Section title={t("ampScaffolds")} parts={scaffolds} masteryParts={masteryParts} onCycle={handleCycle} t={t} />
      <Section title={t("ampBraces")} parts={braces} masteryParts={masteryParts} onCycle={handleCycle} t={t} />
    </div>
  );
}
