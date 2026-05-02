import { useState } from "react";
import { Modal, InputNumber, Button, Typography, Flex, Switch } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { FALLBACK_ICON, handleImgError } from "../../../utils/helpers";
import { useTranslate } from "../../../hooks/useTranslate";
import { useCraftStore } from "../../../stores/craftStore";
import HintPill from "../../shared/HintPill";
import type { SelectedCraftItem } from "../../../types";
import type { Requirement, EnrichedRequirement } from "../../../utils/helpers";
import type { AdjustedTotal } from "../../../hooks/useCraftDerived";

const { Text } = Typography;

interface ConsumerRow extends SelectedCraftItem {
  needed: number;
  completed: number;
  remaining: number;
}

interface Props {
  // Looser than AdjustedTotal — call sites pass either an enriched total or a
  // bare {uniqueName, name, quantity, imageUrl?}. Modal only reads the fields
  // it needs and recalculates live state from consumers.
  material: (Partial<AdjustedTotal> & { uniqueName: string; name: string; quantity?: number; imageUrl?: string | null }) | null;
  open: boolean;
  onClose: () => void;
  detailByItem: Map<string, Requirement[]>;
  onSetCompleted: (itemUniqueName: string, req: Requirement | EnrichedRequirement, val: number | null) => void;
  onBulkDonate: (uniqueName: string, val: number) => void;
}

export default function TotalDetailModal({
  material, open, onClose,
  detailByItem, onSetCompleted, onBulkDonate,
}: Props) {
  const { t } = useTranslate();
  const selectedItems = useCraftStore((s) => s.selectedItems);
  const completedMap = useCraftStore((s) => s.completedMap);
  // Hide completed consumers by default — most users want to see what's
  // still needed, not scroll past 30 done items.
  const [hideDone, setHideDone] = useState<boolean>(true);

  if (!material) return null;

  const consumers: ConsumerRow[] = selectedItems
    .map((item): ConsumerRow | null => {
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
    .filter((c): c is ConsumerRow => c !== null);

  // Live-calculated header stats (material prop is a snapshot, recompute from consumers)
  const liveTotal = consumers.reduce((sum, c) => sum + c.needed, 0);
  const liveCompleted = consumers.reduce((sum, c) => sum + c.completed, 0);
  const liveRemaining = Math.max(0, liveTotal - liveCompleted);
  const livePercent = liveTotal > 0 ? Math.round((liveCompleted / liveTotal) * 100) : 100;
  const liveStatus = liveRemaining === 0 ? "done" : liveCompleted > 0 ? "partial" : "open";
  const doneCount = consumers.filter((c) => c.remaining === 0).length;
  const visibleConsumers = hideDone ? consumers.filter((c) => c.remaining > 0) : consumers;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={820}
      classNames={{ body: "total-detail-modal-body" }}
      title={
        <Flex align="center" gap={14} style={{ paddingRight: 32 }}>
          <img
            src={material.imageUrl || FALLBACK_ICON}
            alt={material.name}
            style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 8, background: "var(--wf-bg-elevated, #152344)", padding: 4 }}
            onError={handleImgError} loading="lazy" decoding="async" />
          <div style={{ flex: 1 }}>
            <Text strong style={{ fontSize: 16 }}>{material.name}</Text>
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              {liveCompleted} / {liveTotal} — {t("remaining")}: {liveRemaining}
            </Text>
          </div>
        </Flex>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <div className="summary-progress-bar" style={{ height: 6, marginTop: 0 }}>
          <div
            className={`summary-progress-fill ${liveStatus === "done" ? "green" : "cyan"}`}
            style={{ width: `${livePercent}%`, height: 6 }}
          />
        </div>
      </div>

      {doneCount > 0 && (
        <HintPill
          id="total-detail-hide-done-2026"
          description={t("hintTotalDetailHide")}
        />
      )}

      <Flex align="center" justify="space-between" style={{ marginBottom: 10 }}>
        <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
          {t("requirementUsedByCount", { count: consumers.length })}
        </Text>
        {doneCount > 0 && (
          <Flex align="center" gap={8}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {t("hideCompletedSwitch", { count: doneCount })}
            </Text>
            <Switch size="small" checked={hideDone} onChange={setHideDone} />
          </Flex>
        )}
      </Flex>

      <div className="detail-req-grid total-detail-scroll">
        <AnimatePresence>
          {visibleConsumers.map((item, i) => {
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
                  onError={handleImgError} loading="lazy" decoding="async" />
                <div className={`detail-req-name ${isDone ? "done" : ""}`}>
                  {item.name}
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
                    onSetCompleted(item.uniqueName, { uniqueName: material.uniqueName, name: material.name, quantity: item.needed }, normalized);
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

      {liveRemaining > 0 && (
        <Flex align="center" gap={10} className="total-detail-bulk-footer">
          <Text style={{ fontSize: 12, whiteSpace: "nowrap" }}>{t("bulkDonate")}:</Text>
          <InputNumber
            min={0}
            max={liveRemaining}
            placeholder={t("bulkDonatePlaceholder")}
            style={{ flex: 1 }}
            id="bulk-donate-input"
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => {
              const input = document.getElementById("bulk-donate-input") as HTMLInputElement | null;
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
