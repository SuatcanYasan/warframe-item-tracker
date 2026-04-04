import { Modal, InputNumber, Typography } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { FALLBACK_ICON } from "../utils/helpers";

const { Text } = Typography;

export default function ItemDetailModal({
  t, tin, item, open, onClose,
  enrichedRequirements, onSetCompleted, onUpdateQuantity,
}) {
  if (!item) return null;

  const reqs = enrichedRequirements || [];
  const total = reqs.length;
  const done = reqs.filter((r) => r.isDone).length;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      className="item-detail-modal"
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 14, paddingRight: 32 }}>
          <img
            src={item.imageUrl || FALLBACK_ICON}
            alt={item.name}
            style={{
              width: 48, height: 48, objectFit: "contain", borderRadius: 8,
              background: "var(--wf-bg-elevated, #152344)", padding: 4,
              clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
            }}
            onError={(e) => { e.target.src = FALLBACK_ICON; }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text strong style={{ fontSize: 16 }}>{tin(item.uniqueName, item.name)}</Text>
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              {item.type || item.category || ""} — {t("componentsProgress", { found: done, total })}
            </Text>
          </div>
        </div>
      }
    >
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 12, padding: "8px 0",
        borderBottom: "1px solid var(--wf-border, rgba(255,255,255,0.06))",
      }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t("componentsProgress", { found: done, total })}
        </Text>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "4px 12px", background: "var(--wf-bg-container, #0f1a30)",
          border: "1px solid var(--wf-border, rgba(255,255,255,0.06))",
          borderRadius: 6,
        }}>
          <Text type="secondary" style={{ fontSize: 12 }}>{t("quantity")}:</Text>
          <InputNumber
            min={1}
            size="small"
            value={item.quantity}
            onChange={(val) => onUpdateQuantity(item.uniqueName, val)}
            style={{ width: 55 }}
          />
        </div>
      </div>
      <div className="detail-req-grid">
        <AnimatePresence>
          {reqs.map((req, i) => (
            <motion.div
              key={req.uniqueName}
              className={`detail-req-card ${req.isDone ? "done" : ""}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <img
                src={req.imageUrl || FALLBACK_ICON}
                alt={req.name}
                className="detail-req-img"
                onError={(e) => { e.target.src = FALLBACK_ICON; }}
              />
              <div className={`detail-req-name ${req.isDone ? "done" : ""}`}>
                {tin(req.uniqueName, req.name)}
              </div>
              <div className="detail-req-bar">
                <div
                  className={`detail-req-fill ${req.isDone ? "green" : "cyan"}`}
                  style={{ width: `${req.completionPercent}%` }}
                />
              </div>
              <div className={`detail-req-nums ${req.isDone ? "ok" : req.completedQuantity === 0 ? "danger" : ""}`}>
                {req.completedQuantity} / {req.quantity}
              </div>
              <InputNumber
                min={0}
                max={req.quantity}
                size="small"
                value={req.completedQuantity}
                onChange={(val) => onSetCompleted(item.uniqueName, req, val)}
                onClick={(e) => e.stopPropagation()}
                className="detail-req-input"
              />
              {req.isDone ? (
                <span className="detail-req-tag ok">{t("completeTag")}</span>
              ) : (
                <span className="detail-req-tag open">{t("remaining")}: {req.remainingQuantity}</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
