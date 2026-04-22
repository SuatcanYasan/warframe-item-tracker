import { Empty, Typography } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import { FALLBACK_ICON, marketUrl, handleImgError } from "../../../utils/helpers";
import { useTranslate } from "../../../hooks/useTranslate";

const { Text } = Typography;

function SetCard({ set }) {
  const { t } = useTranslate();
  const totalParts = set.components.length;
  const ownedParts = set.components.filter((c) => c.owned > 0).length;
  const completeSets = set.components.length > 0
    ? Math.min(...set.components.map((c) => c.owned))
    : 0;
  const allOwned = ownedParts === totalParts && totalParts > 0;
  const progressPercent = totalParts > 0 ? Math.round((ownedParts / totalParts) * 100) : 0;

  return (
    <motion.div
      className={`item-card ${allOwned ? "done" : ""}`}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <div className="item-card-img">
        <img
          src={set.imageUrl || FALLBACK_ICON}
          alt={set.parentName}
          onError={handleImgError} loading="lazy" decoding="async" />
        {completeSets > 0 && (
          <span className="item-card-qty">{t("setCompletable", { count: completeSets })}</span>
        )}
      </div>
      <div className="item-card-body">
        <div className="item-card-name">{set.parentName}</div>
        <div className="item-card-type">{set.parentCategory || ""}</div>
        <div className="item-card-progress-bar">
          <div
            className={`item-card-progress-fill ${allOwned ? "green" : "cyan"}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="item-card-footer">
          <span className={`item-card-progress-text ${allOwned ? "done" : ""}`}>
            {ownedParts} / {totalParts}
          </span>
          <a
            className="item-card-action-btn market-btn"
            href={marketUrl(`${set.parentName} Set`)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={t("viewOnMarket")}
          >
            <img src="https://wiki.warframe.com/images/Platinum.png" alt="" className="market-plat-icon" loading="lazy" decoding="async" />
          </a>
        </div>
        <div className="inventory-set-parts">
          {set.components.map((comp) => (
            <div key={comp.uniqueName} className={`inventory-set-part ${comp.owned > 0 ? "owned" : "missing"}`}>
              <span className="inventory-set-part-name">{comp.name.replace(set.parentName + " ", "")}</span>
              <span className="inventory-set-part-qty">x{comp.owned}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function SetsTab({ sets }) {
  const { t } = useTranslate();
  if (sets.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text type="secondary">{t("noSets")}</Text>} />
      </div>
    );
  }

  return (
    <div className="item-card-grid">
      <AnimatePresence mode="popLayout">
        {sets.map((set) => (
          <SetCard key={set.parentUniqueName} set={set} />
        ))}
      </AnimatePresence>
    </div>
  );
}
