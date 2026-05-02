import { Modal, Button, Typography, Flex } from "antd";
import { CloudOutlined, DesktopOutlined, WarningFilled } from "@ant-design/icons";
import { useTranslate } from "../../hooks/useTranslate";
import { useAppStore } from "../../stores/appStore";

const { Text, Title } = Typography;

// Shown after sign-in when local and cloud both have meaningful data and
// they differ. User picks one source to "win" — the other becomes a merge
// (we don't destroy the loser, just hydrate from the winner; if "Use This
// Device" wins, pushAllState merges local up).

function summarize(state) {
  return [
    { label: "craftItems", value: state.selectedItems?.length || 0 },
    { label: "mastery", value: Object.keys(state.masteredItems || {}).length },
    { label: "inventory", value: Object.keys(state.inventoryParts || {}).length },
    { label: "ampSets", value: state.trackedSets?.length || 0 },
    { label: "checklist", value: state.checklistItems?.length || 0 },
    { label: "farm", value: state.farmResources?.length || 0 },
    { label: "relicComponents", value: Object.values(state.relicFoundComponents || {}).reduce((a, m) => a + Object.keys(m || {}).filter((k) => m[k]).length, 0) },
  ];
}

export default function SyncConflictModal({ onUseLocal, onUseCloud }) {
  const { t } = useTranslate();
  const conflict = useAppStore((s) => s.syncConflict);

  if (!conflict) return null;
  const localSummary = summarize(conflict.local);
  const cloudSummary = summarize(conflict.cloud);

  const labelMap = {
    craftItems: t("syncConflictCraft"),
    mastery: t("syncConflictMastery"),
    inventory: t("syncConflictInventory"),
    ampSets: t("syncConflictAmp"),
    checklist: t("syncConflictChecklist"),
    farm: t("syncConflictFarm"),
    relicComponents: t("syncConflictRelic"),
  };

  return (
    <Modal
      open
      closable={false}
      maskClosable={false}
      keyboard={false}
      footer={null}
      width={620}
      title={<><WarningFilled style={{ color: "var(--wf-primary)", marginRight: 10 }} />{t("syncConflictTitle")}</>}
    >
      <Text style={{ display: "block", marginBottom: 16 }}>{t("syncConflictBody")}</Text>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="sync-conflict-card">
          <Flex align="center" gap={8} style={{ marginBottom: 10 }}>
            <DesktopOutlined style={{ color: "var(--wf-cyan)" }} />
            <Title level={5} style={{ margin: 0 }}>{t("syncConflictLocal")}</Title>
          </Flex>
          {localSummary.map((row) => {
            const otherRow = cloudSummary.find((c) => c.label === row.label);
            const more = otherRow && row.value > otherRow.value;
            return (
              <Flex key={row.label} justify="space-between" style={{ fontSize: 12, marginBottom: 4 }}>
                <Text type="secondary">{labelMap[row.label]}</Text>
                <Text strong style={{ color: more ? "var(--wf-primary)" : undefined }}>{row.value}</Text>
              </Flex>
            );
          })}
        </div>

        <div className="sync-conflict-card">
          <Flex align="center" gap={8} style={{ marginBottom: 10 }}>
            <CloudOutlined style={{ color: "var(--wf-cyan)" }} />
            <Title level={5} style={{ margin: 0 }}>{t("syncConflictCloud")}</Title>
          </Flex>
          {cloudSummary.map((row) => {
            const otherRow = localSummary.find((c) => c.label === row.label);
            const more = otherRow && row.value > otherRow.value;
            return (
              <Flex key={row.label} justify="space-between" style={{ fontSize: 12, marginBottom: 4 }}>
                <Text type="secondary">{labelMap[row.label]}</Text>
                <Text strong style={{ color: more ? "var(--wf-primary)" : undefined }}>{row.value}</Text>
              </Flex>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
        <Button
          size="large"
          type="primary"
          icon={<DesktopOutlined />}
          onClick={onUseLocal}
          block
        >
          {t("syncConflictUseLocal")}
        </Button>
        <Button
          size="large"
          icon={<CloudOutlined />}
          onClick={onUseCloud}
          block
        >
          {t("syncConflictUseCloud")}
        </Button>
        <Text type="secondary" style={{ fontSize: 11, textAlign: "center", marginTop: 6 }}>
          {t("syncConflictNote")}
        </Text>
      </div>
    </Modal>
  );
}
