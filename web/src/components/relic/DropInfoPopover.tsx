import { useState } from "react";
import { Modal, Spin, List, Tag, Typography, Flex, Empty, Collapse } from "antd";
import { InfoCircleOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { requestJson } from "../../utils/helpers";
import type { TranslateFn } from "../../hooks/useTranslate";

const { Text } = Typography;

const rarityColors: Record<string, string> = {
  Common: "default",
  Uncommon: "green",
  Rare: "blue",
  Legendary: "gold",
};

interface Drop {
  location?: string;
  rarity?: string;
  chance?: number;
}

interface ComponentDrop {
  componentName: string;
  drops: Drop[];
}

interface DropResponse {
  drops?: Drop[];
  componentDrops?: ComponentDrop[];
  description?: string | null;
}

interface RelicGroup {
  location: string;
  rarity?: string;
  refinements: Record<string, number>;
}

function detectRarity(intactChance: number | null | undefined): string | null {
  if (intactChance == null) return null;
  if (intactChance >= 20) return "Common";
  if (intactChance >= 8) return "Uncommon";
  return "Rare";
}

interface Props {
  uniqueName: string;
  itemName: string;
  t: TranslateFn;
}

export default function DropInfoPopover({ uniqueName, itemName, t }: Props) {
  const [data, setData] = useState<DropResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  async function fetchDrops() {
    if (data) return;
    setLoading(true);
    try {
      const result = await requestJson(`/api/items/drops/${encodeURIComponent(uniqueName)}`);
      setData(result as DropResponse);
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

  function groupByRelic(drops: Drop[]): RelicGroup[] {
    const groups = new Map<string, RelicGroup>();
    for (const drop of drops) {
      const loc = drop.location || "";
      const match = loc.match(/^(.+?)(?:\s*\((Exceptional|Flawless|Radiant)\))?$/);
      const baseName = match ? match[1].trim() : loc;
      const refinement = match && match[2] ? match[2] : "Intact";
      if (!groups.has(baseName)) {
        groups.set(baseName, { location: baseName, rarity: drop.rarity, refinements: {} });
      }
      groups.get(baseName)!.refinements[refinement] = Number(drop.chance);
    }
    return Array.from(groups.values());
  }

  function renderRelicRow(group: RelicGroup, accentColor: string) {
    const { Intact, Exceptional, Flawless, Radiant } = group.refinements;
    const correctRarity = detectRarity(Intact);
    return (
      <List.Item style={{ padding: "8px 0", borderBottom: "1px solid var(--wf-border)" }}>
        <div style={{ width: "100%" }}>
          <Flex align="center" gap={6} style={{ marginBottom: 4 }}>
            <EnvironmentOutlined style={{ color: accentColor, fontSize: 11 }} />
            <Text style={{ flex: 1, fontSize: 12, fontWeight: 600 }} ellipsis>{group.location}</Text>
            {correctRarity && (
              <Tag color={rarityColors[correctRarity] || "default"} style={{ fontSize: 10, lineHeight: "16px", margin: 0 }}>
                {correctRarity}
              </Tag>
            )}
          </Flex>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, fontSize: 10 }}>
            {([
              ["Intact", Intact],
              ["Exceptional", Exceptional],
              ["Flawless", Flawless],
              ["Radiant", Radiant],
            ] as Array<[string, number | undefined]>).map(([level, val]) => (
              <div key={level} style={{
                padding: "3px 6px",
                background: "color-mix(in srgb, var(--wf-bg-base) 60%, var(--wf-bg-container))",
                border: "1px solid var(--wf-border)",
                borderRadius: 4,
                textAlign: "center",
                fontFamily: "var(--font-mono)",
              }}>
                <div style={{ color: "var(--wf-text-muted)", fontSize: 9 }}>{t(`refinement${level}`)}</div>
                <div style={{ color: val != null ? "var(--wf-primary)" : "var(--wf-text-muted)", fontWeight: 600 }}>
                  {val != null ? `${val.toFixed(1)}%` : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </List.Item>
    );
  }

  function renderSimpleDropRow(drop: Drop, accentColor: string) {
    const isRelicDrop = /Relic/i.test(drop.location || "");
    const displayRarity = isRelicDrop ? detectRarity(drop.chance) : drop.rarity;
    return (
      <List.Item style={{ padding: "4px 0", border: "none" }}>
        <Flex align="center" gap={6} style={{ width: "100%" }}>
          <EnvironmentOutlined style={{ color: accentColor, fontSize: 11 }} />
          <Text style={{ flex: 1, fontSize: 12 }} ellipsis>{drop.location}</Text>
          {displayRarity && (
            <Tag color={rarityColors[displayRarity] || "default"} style={{ fontSize: 10, lineHeight: "16px", margin: 0 }}>
              {displayRarity}
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
                <Text strong style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--wf-primary)" }}>
                  Drop Locations ({allDrops.length})
                </Text>
                <div style={{ maxHeight: 200, overflowY: "auto", marginTop: 4 }}>
                  <List size="small" dataSource={allDrops}
                    renderItem={(drop: Drop) => renderSimpleDropRow(drop, "var(--wf-primary)")}
                  />
                </div>
              </div>
            )}

            {componentDrops.length > 0 && (
              <>
                <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 8, fontStyle: "italic" }}>
                  {t("refinementHint")}
                </Text>
                <Collapse
                  ghost
                  size="small"
                  items={componentDrops.map((comp) => {
                    const grouped = groupByRelic(comp.drops);
                    return {
                      key: comp.componentName,
                      label: (
                        <Text strong style={{ fontSize: 12 }}>
                          {comp.componentName} <Text type="secondary" style={{ fontSize: 11 }}>({grouped.length} relic)</Text>
                        </Text>
                      ),
                      children: (
                        <div style={{ maxHeight: 280, overflowY: "auto" }}>
                          <List size="small" dataSource={grouped}
                            renderItem={(group: RelicGroup) => renderRelicRow(group, "var(--wf-primary)")}
                          />
                        </div>
                      ),
                    };
                  })}
                />
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
