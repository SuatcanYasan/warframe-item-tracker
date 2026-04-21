import { motion, AnimatePresence } from "framer-motion";
import { Empty, Typography, Spin } from "antd";
import { FALLBACK_ICON, handleImgError } from "../../utils/helpers";
import { useTranslate } from "../../hooks/useTranslate";
import { useCraftStore } from "../../stores/craftStore";

const { Text } = Typography;

export default function TotalsCardGrid({ adjustedTotals, onOpenDetail }) {
  const { t, tin } = useTranslate();
  const loadingCalc = useCraftStore((s) => s.loadingCalc);
  if (loadingCalc) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spin /></div>;
  }

  if (adjustedTotals.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text type="secondary">{t("noSelected")}</Text>} />
      </div>
    );
  }

  return (
    <div className="totals-card-grid">
      <AnimatePresence mode="popLayout">
        {adjustedTotals.map((item, index) => {
          const isDone = item.status === "done";
          return (
            <motion.div
              key={item.uniqueName}
              className={`total-card ${isDone ? "done" : ""}`}
              onClick={() => onOpenDetail(item)}
              style={{ cursor: "pointer" }}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
            >
              <img
                src={item.imageUrl || FALLBACK_ICON}
                alt={item.name}
                className="total-card-img"
                onError={handleImgError}
              />
              <div className="total-card-name">{tin(item.uniqueName, item.name)}</div>
              <div className="total-card-bar">
                <div
                  className={`total-card-fill ${isDone ? "green" : "cyan"}`}
                  style={{ width: `${item.completionPercent}%` }}
                />
              </div>
              <div className={`total-card-nums ${isDone ? "done" : item.remaining === item.quantity ? "danger" : ""}`}>
                {item.completedAmount} / {item.quantity}
              </div>
              {isDone ? (
                <span className="total-card-tag ok">{t("completeTag")}</span>
              ) : (
                <span className="total-card-tag open">{t("remaining")}: {item.remaining}</span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
