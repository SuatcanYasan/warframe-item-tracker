import { useState, useMemo } from "react";
import { Input, Button, Segmented, Empty, Tooltip, Progress } from "antd";
import { PlusOutlined, DeleteOutlined, CheckOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useTranslate } from "../../hooks/useTranslate";
import { useChecklistStore, isItemDoneNow } from "../../stores/checklistStore";

const PRESETS = [
  { text: "Sortie", type: "daily" },
  { text: "Archon Hunt", type: "weekly" },
  { text: "Nightwave Daily 1", type: "daily" },
  { text: "Nightwave Daily 2", type: "daily" },
  { text: "Nightwave Daily 3", type: "daily" },
  { text: "Syndicate Standing Cap", type: "daily" },
  { text: "Cetus Bounties", type: "daily" },
  { text: "Fortuna Bounties", type: "daily" },
  { text: "Deimos Bounties", type: "daily" },
  { text: "Kahl's Garrison", type: "weekly" },
  { text: "Duviri Circuit Tier", type: "weekly" },
  { text: "Arbitration Run", type: "daily" },
];

export default function ChecklistPage() {
  const { t } = useTranslate();
  const items = useChecklistStore((s) => s.items);
  const addItem = useChecklistStore((s) => s.addItem);
  const removeItem = useChecklistStore((s) => s.removeItem);
  const toggleItem = useChecklistStore((s) => s.toggleItem);
  const bulkAddPresets = useChecklistStore((s) => s.bulkAddPresets);

  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState("daily");

  const dailyItems = useMemo(() => items.filter((i) => i.type === "daily"), [items]);
  const weeklyItems = useMemo(() => items.filter((i) => i.type === "weekly"), [items]);

  const dailyDone = dailyItems.filter(isItemDoneNow).length;
  const weeklyDone = weeklyItems.filter(isItemDoneNow).length;
  const totalDone = dailyDone + weeklyDone;
  const totalItems = items.length;
  const pct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  function handleAdd() {
    const text = newText.trim();
    if (!text) return;
    addItem({ text, type: newType });
    setNewText("");
    toast.success(t("checklistAdded"));
  }

  function handleAddPresets() {
    bulkAddPresets(PRESETS);
    toast.success(t("checklistPresetsAdded"));
  }

  function renderGroup(list, titleKey, typeTag) {
    if (list.length === 0) return null;
    const done = list.filter(isItemDoneNow).length;
    return (
      <div className="checklist-group">
        <div className="checklist-group-header">
          <h3 className="activities-section-title">
            {t(titleKey)}
            <span className="activities-section-count">{done}/{list.length}</span>
          </h3>
          <Progress
            percent={list.length > 0 ? Math.round((done / list.length) * 100) : 0}
            showInfo={false}
            size="small"
            strokeColor="var(--wf-primary)"
            trailColor="var(--wf-border)"
            style={{ width: 120, marginBottom: 0 }}
          />
        </div>
        <div className="checklist-items">
          <AnimatePresence mode="popLayout">
            {list.map((item) => {
              const done = isItemDoneNow(item);
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  className={`checklist-item ${done ? "done" : ""}`}
                  onClick={() => toggleItem(item.id)}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="checklist-item-check">
                    {done && <CheckOutlined />}
                  </div>
                  <span className="checklist-item-text">{item.text}</span>
                  {item.isPreset && (
                    <span className="checklist-item-preset-tag">{t("checklistPresetTag")}</span>
                  )}
                  <span
                    className="checklist-item-delete"
                    onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                    title={t("checklistRemove")}
                  >
                    <DeleteOutlined />
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="checklist-page">
      <div className="activities-header">
        <div className="activities-header-icon-wrap">
          <ThunderboltOutlined className="activities-header-icon" />
        </div>
        <div>
          <h1 className="activities-title">{t("checklistTitle")}</h1>
          <p className="activities-subtitle">{t("checklistSubtitle")}</p>
        </div>
      </div>

      {totalItems > 0 && (
        <div className="checklist-summary">
          <div className="checklist-summary-stat">
            <div className="checklist-summary-value">{totalDone}/{totalItems}</div>
            <div className="checklist-summary-label">{t("checklistDoneOfTotal")}</div>
          </div>
          <div className="checklist-summary-stat">
            <div className="checklist-summary-value">{pct}%</div>
            <div className="checklist-summary-label">{t("checklistProgress")}</div>
          </div>
          <div className="checklist-summary-stat">
            <div className="checklist-summary-value">{dailyDone}/{dailyItems.length}</div>
            <div className="checklist-summary-label">{t("checklistDaily")}</div>
          </div>
          <div className="checklist-summary-stat">
            <div className="checklist-summary-value">{weeklyDone}/{weeklyItems.length}</div>
            <div className="checklist-summary-label">{t("checklistWeekly")}</div>
          </div>
        </div>
      )}

      <div className="checklist-add">
        <Input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onPressEnter={handleAdd}
          placeholder={t("checklistAddPlaceholder")}
          size="large"
          style={{ flex: 1 }}
        />
        <Segmented
          value={newType}
          onChange={setNewType}
          options={[
            { value: "daily", label: t("checklistDaily") },
            { value: "weekly", label: t("checklistWeekly") },
          ]}
          size="large"
        />
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAdd}>
          {t("add")}
        </Button>
      </div>

      {totalItems === 0 ? (
        <div className="checklist-empty">
          <Empty description={
            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>{t("checklistEmptyTitle")}</div>
              <div style={{ fontSize: 12, color: "var(--wf-text-muted)", marginBottom: 12 }}>
                {t("checklistEmptyHint")}
              </div>
              <Tooltip title={t("checklistPresetsTip")}>
                <Button type="primary" onClick={handleAddPresets}>
                  {t("checklistAddPresets")}
                </Button>
              </Tooltip>
            </div>
          } />
        </div>
      ) : (
        <>
          {renderGroup(dailyItems, "checklistDaily", "daily")}
          {renderGroup(weeklyItems, "checklistWeekly", "weekly")}
          <p className="checklist-reset-note">{t("checklistResetNote")}</p>
        </>
      )}
    </div>
  );
}
