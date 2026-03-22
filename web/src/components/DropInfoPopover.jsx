import { useState } from "react";
import { Popover, Button, Spin, List, Tag, Typography, Space, Flex, Empty } from "antd";
import { InfoCircleOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { requestJson } from "../utils/helpers";

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

  function handleOpenChange(visible) {
    setOpen(visible);
    if (visible) fetchDrops();
  }

  const allDrops = data?.drops || [];
  const componentDrops = data?.componentDrops || [];
  const description = data?.description || null;
  const hasData = allDrops.length > 0 || componentDrops.length > 0 || description;

  const content = loading ? (
    <Flex justify="center" style={{ padding: 16, minWidth: 260 }}>
      <Spin size="small" />
    </Flex>
  ) : !hasData ? (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      imageStyle={{ height: 28 }}
      description={<Text type="secondary" style={{ fontSize: 12 }}>Drop bilgisi bulunamadi</Text>}
      style={{ margin: "8px 0", minWidth: 220 }}
    />
  ) : (
    <div style={{ maxWidth: 360, maxHeight: 400, overflow: "auto" }}>
      {description && (
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
          {description}
        </Text>
      )}

      {allDrops.length > 0 && (
        <>
          <Text strong style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Drop Locations
          </Text>
          <List
            size="small"
            dataSource={allDrops.slice(0, 15)}
            style={{ marginTop: 4 }}
            renderItem={(drop) => (
              <List.Item style={{ padding: "4px 0", border: "none" }}>
                <Flex align="center" gap={6} style={{ width: "100%" }}>
                  <EnvironmentOutlined style={{ color: "var(--accent-gold)", fontSize: 11 }} />
                  <Text style={{ flex: 1, fontSize: 12 }} ellipsis>{drop.location}</Text>
                  {drop.rarity && (
                    <Tag
                      color={rarityColors[drop.rarity] || "default"}
                      style={{ fontSize: 10, lineHeight: "16px", margin: 0 }}
                    >
                      {drop.rarity}
                    </Tag>
                  )}
                  {drop.chance != null && (
                    <Text type="secondary" style={{ fontSize: 10, fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                      {(drop.chance * 100).toFixed(1)}%
                    </Text>
                  )}
                </Flex>
              </List.Item>
            )}
          />
          {allDrops.length > 15 && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              +{allDrops.length - 15} more...
            </Text>
          )}
        </>
      )}

      {componentDrops.map((comp) => (
        <div key={comp.componentName} style={{ marginTop: 8 }}>
          <Text strong style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {comp.componentName}
          </Text>
          <List
            size="small"
            dataSource={comp.drops.slice(0, 8)}
            style={{ marginTop: 2 }}
            renderItem={(drop) => (
              <List.Item style={{ padding: "3px 0", border: "none" }}>
                <Flex align="center" gap={6} style={{ width: "100%" }}>
                  <EnvironmentOutlined style={{ color: "var(--accent-cyan)", fontSize: 11 }} />
                  <Text style={{ flex: 1, fontSize: 12 }} ellipsis>{drop.location}</Text>
                  {drop.rarity && (
                    <Tag
                      color={rarityColors[drop.rarity] || "default"}
                      style={{ fontSize: 10, lineHeight: "16px", margin: 0 }}
                    >
                      {drop.rarity}
                    </Tag>
                  )}
                  {drop.chance != null && (
                    <Text type="secondary" style={{ fontSize: 10, fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                      {(drop.chance * 100).toFixed(1)}%
                    </Text>
                  )}
                </Flex>
              </List.Item>
            )}
          />
        </div>
      ))}
    </div>
  );

  return (
    <Popover
      content={content}
      title={
        <Text strong style={{ fontFamily: "var(--font-display)", letterSpacing: 0.3 }}>
          {itemName}
        </Text>
      }
      trigger="click"
      open={open}
      onOpenChange={handleOpenChange}
      placement="leftTop"
    >
      <Button
        type="text"
        size="small"
        icon={<InfoCircleOutlined />}
        onClick={(e) => e.stopPropagation()}
        style={{ opacity: 0.5, transition: "opacity 150ms" }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
      />
    </Popover>
  );
}
