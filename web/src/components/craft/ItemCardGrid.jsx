import { motion, AnimatePresence } from "framer-motion";
import { DeleteOutlined } from "@ant-design/icons";
import { Empty, Typography } from "antd";
import { FALLBACK_ICON } from "../../utils/helpers";
import DropInfoPopover from "../relic/DropInfoPopover";
import { useTranslate } from "../../hooks/useTranslate";

const { Text } = Typography;

export default function ItemCardGrid({ items, enrichedByItem, onOpenDetail, onRemoveItem }) {
  const { t, tin } = useTranslate();
  if (items.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text type="secondary">{t("noSelected")}</Text>} />
      </div>
    );
  }

  return (
    <div className="item-card-grid">
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => {
          const reqs = enrichedByItem.get(item.uniqueName) || [];
          const total = reqs.length;
          const done = reqs.filter((r) => r.isDone).length;
          const allDone = total > 0 && done === total;
          const percent = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <motion.div
              key={item.uniqueName}
              className={`item-card ${allDone ? "done" : ""}`}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              onClick={() => onOpenDetail(item)}
            >
              <div className="item-card-img">
                <img
                  src={item.imageUrl || FALLBACK_ICON}
                  alt={item.name}
                  onError={(e) => { e.target.src = FALLBACK_ICON; }}
                />
                <span className="item-card-qty">x{item.quantity}</span>
                {allDone && <span className="item-card-done-badge">{t("completeTag")}</span>}
              </div>
              <div className="item-card-body">
                <div className="item-card-name">{tin(item.uniqueName, item.name)}</div>
                <div className="item-card-type">
                  {item.type || item.category || t("unknown")}
                </div>
                <div className="item-card-progress-bar">
                  <div
                    className={`item-card-progress-fill ${allDone ? "green" : "cyan"}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="item-card-footer">
                  <span className={`item-card-progress-text ${allDone ? "done" : ""}`}>
                    {done} / {total}
                  </span>
                  <div className="item-card-actions" onClick={(e) => e.stopPropagation()}>
                    <DropInfoPopover uniqueName={item.uniqueName} itemName={item.name} t={t} />
                    <button
                      className="item-card-action-btn danger"
                      onClick={(e) => { e.stopPropagation(); onRemoveItem(item); }}
                      title={t("remove")}
                    >
                      <DeleteOutlined />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
