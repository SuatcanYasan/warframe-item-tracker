import { Modal, InputNumber, Button, Typography, Flex, App as AntApp } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { FALLBACK_ICON } from "../../../utils/helpers";
import { useTranslate } from "../../../hooks/useTranslate";
import { useCraftStore } from "../../../stores/craftStore";

const { Text } = Typography;

export default function TotalDetailModal({
  material, open, onClose,
  detailByItem, onSetCompleted, onBulkDonate,
}) {
  const { t, tin } = useTranslate();
  const selectedItems = useCraftStore((s) => s.selectedItems);
  const completedMap = useCraftStore((s) => s.completedMap);
  const { message } = AntApp.useApp();

  if (!material) return null;

  const consumers = selectedItems
    .map((item) => {
      const reqs = detailByItem.get(item.uniqueName) || [];
      const req = reqs.find((r) => r.uniqueName === material.uniqueName);
      if (!req) return null;
      const completed = Math.min(
        req.quantity,
        Math.max(0, Number(completedMap[item.uniqueName]?.[material.uniqueName]) || 0),
      );
      const remaining = req.quantity - completed;
      return { ...item, needed: req.quantity, completed, remaining };
    })
    .filter(Boolean);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      title={
        <Flex align="center" gap={14} style={{ paddingRight: 32 }}>
          <img
            src={material.imageUrl || FALLBACK_ICON}
            alt={material.name}
            style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 8, background: "var(--wf-bg-elevated, #152344)", padding: 4 }}
            onError={(e) => { e.target.src = FALLBACK_ICON; }}
          />
          <div style={{ flex: 1 }}>
            <Text strong style={{ fontSize: 16 }}>{tin(material.uniqueName, material.name)}</Text>
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              {material.completedAmount} / {material.quantity} — {t("remaining")}: {material.remaining}
            </Text>
          </div>
        </Flex>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <div className="summary-progress-bar" style={{ height: 6, marginTop: 0 }}>
          <div
            className={`summary-progress-fill ${material.status === "done" ? "green" : "cyan"}`}
            style={{ width: `${material.completionPercent}%`, height: 6 }}
          />
        </div>
      </div>

      <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 10 }}>
        {t("requirementUsedByCount", { count: consumers.length })}
      </Text>

      <div className="detail-req-grid">
        <AnimatePresence>
          {consumers.map((item, i) => {
            const isDone = item.remaining === 0;
            return (
              <motion.div
                key={item.uniqueName}
                className={`detail-req-card ${isDone ? "done" : ""}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <img
                  src={item.imageUrl || FALLBACK_ICON}
                  alt={item.name}
                  className="detail-req-img"
                  onError={(e) => { e.target.src = FALLBACK_ICON; }}
                />
                <div className={`detail-req-name ${isDone ? "done" : ""}`}>
                  {tin(item.uniqueName, item.name)}
                </div>
                <div className="detail-req-bar">
                  <div
                    className={`detail-req-fill ${isDone ? "green" : "cyan"}`}
                    style={{ width: `${item.needed > 0 ? Math.round((item.completed / item.needed) * 100) : 100}%` }}
                  />
                </div>
                <div className={`detail-req-nums ${isDone ? "ok" : item.completed === 0 ? "danger" : ""}`}>
                  {item.completed} / {item.needed}
                </div>
                <InputNumber
                  min={0}
                  max={item.needed}
                  size="small"
                  value={item.completed}
                  onChange={(val) => {
                    const normalized = Math.min(item.needed, Math.max(0, Number(val) || 0));
                    onSetCompleted(item.uniqueName, { uniqueName: material.uniqueName, quantity: item.needed }, normalized);
                  }}
                  className="detail-req-input"
                />
                {isDone ? (
                  <span className="detail-req-tag ok">{t("completeTag")}</span>
                ) : (
                  <span className="detail-req-tag open">{t("remaining")}: {item.remaining}</span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {material.remaining > 0 && (
        <Flex align="center" gap={10} style={{
          padding: "12px 14px", marginTop: 16,
          background: "var(--wf-bg-container, #0f1a30)",
          border: "1px solid var(--wf-border, rgba(255,255,255,0.06))",
          borderRadius: 8,
        }}>
          <Text style={{ fontSize: 12, whiteSpace: "nowrap" }}>{t("bulkDonate")}:</Text>
          <InputNumber
            min={0}
            max={material.remaining}
            placeholder={t("bulkDonatePlaceholder")}
            style={{ flex: 1 }}
            id="bulk-donate-input"
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => {
              const input = document.getElementById("bulk-donate-input");
              const val = Number(input?.value) || 0;
              if (val > 0) {
                onBulkDonate(material.uniqueName, val);
                if (input) input.value = "";
              }
            }}
          >
            {t("bulkDonateApply")}
          </Button>
        </Flex>
      )}
    </Modal>
  );
}
