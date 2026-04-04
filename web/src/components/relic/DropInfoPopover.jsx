import { useState } from "react";
import { Modal, Spin, List, Tag, Typography, Flex, Empty, Collapse } from "antd";
import { InfoCircleOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { requestJson } from "../../utils/helpers";

const { Text } = Typography;

const rarityColors = {
  Common: "default",
  Uncommon: "green",
  Rare: "blue",
  Legendary: "gold",
};

export default function DropInfoPopover({ uniqueName, itemName, t }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function fetchDrops() {
    if (data) return;
    setLoading(true);
    try {
      const result = await requestJson(`/api/items/drops/${encodeURIComponent(uniqueName)}`);
      setData(result);
    } catch {
      setData({ drops: [], componentDrops: [], description: null });
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    fetchDrops();
  }

  const allDrops = data?.drops || [];
  const componentDrops = data?.componentDrops || [];
  const description = data?.description || null;
  const hasData = allDrops.length > 0 || componentDrops.length > 0 || description;

  function renderDropRow(drop, accentColor) {
    return (
      <List.Item style={{ padding: "4px 0", border: "none" }}>
        <Flex align="center" gap={6} style={{ width: "100%" }}>
          <EnvironmentOutlined style={{ color: accentColor, fontSize: 11 }} />
          <Text style={{ flex: 1, fontSize: 12 }} ellipsis>{drop.location}</Text>
          {drop.rarity && (
            <Tag color={rarityColors[drop.rarity] || "default"} style={{ fontSize: 10, lineHeight: "16px", margin: 0 }}>
              {drop.rarity}
            </Tag>
          )}
          {drop.chance != null && (
            <Text type="secondary" style={{ fontSize: 10, fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
              {Number(drop.chance).toFixed(1)}%
            </Text>
          )}
        </Flex>
      </List.Item>
    );
  }

  return (
    <>
      <button
        className="item-card-action-btn"
        onClick={(e) => { e.stopPropagation(); handleOpen(); }}
        title="Drop Info"
      >
        <InfoCircleOutlined />
      </button>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={560}
        title={
          <Text strong style={{ fontFamily: "var(--font-display)", fontSize: 16, letterSpacing: 0.3 }}>
            {itemName} — Drop Info
          </Text>
        }
      >
        {loading ? (
          <Flex justify="center" style={{ padding: 32 }}><Spin /></Flex>
        ) : !hasData ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Drop bilgisi bulunamadi" />
        ) : (
          <div style={{ maxHeight: 500, overflowY: "auto" }}>
            {description && (
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}>
                {description}
              </Text>
            )}

            {allDrops.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--accent-gold)" }}>
                  Drop Locations ({allDrops.length})
                </Text>
                <div style={{ maxHeight: 200, overflowY: "auto", marginTop: 4 }}>
                  <List size="small" dataSource={allDrops}
                    renderItem={(drop) => renderDropRow(drop, "var(--accent-gold)")}
                  />
                </div>
              </div>
            )}

            {componentDrops.length > 0 && (
              <Collapse
                ghost
                size="small"
                items={componentDrops.map((comp) => ({
                  key: comp.componentName,
                  label: (
                    <Text strong style={{ fontSize: 12 }}>
                      {comp.componentName} <Text type="secondary" style={{ fontSize: 11 }}>({comp.drops.length} drops)</Text>
                    </Text>
                  ),
                  children: (
                    <div style={{ maxHeight: 200, overflowY: "auto" }}>
                      <List size="small" dataSource={comp.drops}
                        renderItem={(drop) => renderDropRow(drop, "var(--wf-primary)")}
                      />
                    </div>
                  ),
                }))}
              />
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
