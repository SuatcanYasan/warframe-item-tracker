import { InputNumber } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { Empty, Typography } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import { FALLBACK_ICON } from "../../../utils/helpers";
import { useTranslate } from "../../../hooks/useTranslate";

const { Text } = Typography;

function PartCard({ part, onUpdateQty, onRemove }) {
  const { t, tin } = useTranslate();
  return (
    <motion.div
      className="item-card"
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <div className="item-card-img">
        <img
          src={part.parentImageUrl || FALLBACK_ICON}
          alt={part.name}
          onError={(e) => { e.target.src = FALLBACK_ICON; }}
        />
        <span className="item-card-qty">x{part.quantity}</span>
      </div>
      <div className="item-card-body">
        <div className="item-card-name">{tin(part.uniqueName, part.name)}</div>
        <div className="item-card-type">{tin(part.parentUniqueName, part.parentName)}</div>
        <div className="item-card-footer">
          <InputNumber
            min={0}
            max={99}
            value={part.quantity}
            size="small"
            style={{ width: 64 }}
            onChange={(v) => onUpdateQty(part.uniqueName, v ?? 0)}
          />
          <div className="item-card-actions">
            <button className="item-card-action-btn" onClick={() => onRemove(part.uniqueName)} title={t("removePart")}>
              <DeleteOutlined />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function PartsTab({ partsList, onUpdateQty, onRemove }) {
  const { t } = useTranslate();
  if (partsList.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text type="secondary">{t("noParts")}</Text>} />
      </div>
    );
  }

  return (
    <div className="item-card-grid">
      <AnimatePresence mode="popLayout">
        {partsList.map((part) => (
          <PartCard
            key={part.uniqueName}
            part={part}
            onUpdateQty={onUpdateQty}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
