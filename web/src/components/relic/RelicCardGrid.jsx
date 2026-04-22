import { useState, useCallback, useMemo } from "react";
import {
  Button, Collapse, Empty, Flex, List, Modal, Progress, Segmented, Spin, Tag, Typography,
} from "antd";
import {
  CheckOutlined, DeleteOutlined, GoldOutlined,
} from "@ant-design/icons";
import { FALLBACK_ICON, handleImgError } from "../../utils/helpers";
import { useItemDrops } from "../../hooks/useApiQueries";
import { useTranslate } from "../../hooks/useTranslate";

const { Text } = Typography;

const rarityColors = { Common: "default", Uncommon: "green", Rare: "blue", Legendary: "gold" };
const REFINEMENT_LEVELS = ["Intact", "Exceptional", "Flawless", "Radiant"];

// WFCD rarity tags are unreliable — compute correct rarity from Intact chance.
// Warframe Intact rates: Common 25.33%, Uncommon 11%, Rare 2%.
function detectRarity(intactChance) {
  if (intactChance == null) return null;
  if (intactChance >= 20) return "Common";
  if (intactChance >= 8) return "Uncommon";
  return "Rare";
}

function parseRefinement(location) {
  const match = location.match(/\((\w+)\)$/);
  return match ? match[1] : "Intact";
}

function getBaseRelicName(location) {
  return location.replace(/\s*\(\w+\)$/, "");
}

function groupDropsByRelic(drops) {
  const grouped = new Map();
  for (const drop of drops) {
    const base = getBaseRelicName(drop.location);
    const refinement = parseRefinement(drop.location);
    if (!grouped.has(base)) {
      grouped.set(base, { baseName: base, rarity: drop.rarity, byRefinement: {} });
    }
    grouped.get(base).byRefinement[refinement] = drop.chance;
  }
  // After grouping, override rarity using the Intact chance (more reliable than WFCD's label)
  for (const group of grouped.values()) {
    const intact = group.byRefinement["Intact"];
    const computed = detectRarity(intact);
    if (computed) group.rarity = computed;
  }
  return Array.from(grouped.values());
}

function RelicPrimeCard({ prime, foundMap, onToggleFound, onRemove, onOpenModal }) {
  const { t } = useTranslate();
  const { data: dropData } = useItemDrops(prime.uniqueName);
  const componentDrops = dropData?.componentDrops || [];
  const droppableComponents = componentDrops.filter((c) => c.drops && c.drops.length > 0);
  const totalComponents = droppableComponents.length;
  const foundCount = droppableComponents.filter((c) => foundMap[c.componentName]).length;
  const allFound = totalComponents > 0 && foundCount === totalComponents;
  const progressPercent = totalComponents > 0 ? Math.round((foundCount / totalComponents) * 100) : 0;

  return (
    <div className={`item-card ${allFound ? "done" : ""}`} onClick={() => onOpenModal(prime)}>
      <div className="item-card-img">
        <img
          src={prime.imageUrl || FALLBACK_ICON}
          alt={prime.name}
          onError={handleImgError}
        />
        {allFound && <span className="item-card-done-badge">{t("allPartsFound")}</span>}
      </div>
      <div className="item-card-body">
        <div className="item-card-name">{prime.name}</div>
        <div className="item-card-type">{prime.type || prime.category || ""}</div>
        <div className="item-card-progress-bar">
          <div
            className={`item-card-progress-fill ${allFound ? "green" : "cyan"}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="item-card-footer">
          <span className={`item-card-progress-text ${allFound ? "done" : ""}`}>
            {foundCount} / {totalComponents}
          </span>
          <div className="item-card-actions"></div>
        </div>
      </div>
    </div>
  );
}

function RelicDetailModal({ prime, open, onClose, foundMap, onToggleFound }) {
  const { t } = useTranslate();
  const [componentActiveKeys, setComponentActiveKeys] = useState([]);
  const [refinementLevel, setRefinementLevel] = useState("Intact");

  const { data: dropData, isLoading: loadingDrops } = useItemDrops(open ? prime?.uniqueName : null);

  if (!prime) return null;

  const componentDrops = dropData?.componentDrops || [];
  const droppableComponents = componentDrops.filter((c) => c.drops && c.drops.length > 0);
  const totalComponents = droppableComponents.length;
  const foundCount = droppableComponents.filter((c) => foundMap[c.componentName]).length;
  const allFound = totalComponents > 0 && foundCount === totalComponents;
  const progressPercent = totalComponents > 0 ? Math.round((foundCount / totalComponents) * 100) : 0;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      title={
        <Flex align="center" gap={12}>
          <img src={prime.imageUrl || FALLBACK_ICON} alt={prime.name} className="item-thumb" />
          <div>
            <Text strong style={{ fontSize: 16 }}>{prime.name}</Text>
            {totalComponents > 0 && (
              <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                {t("componentsProgress", { found: foundCount, total: totalComponents })}
              </Text>
            )}
          </div>
          {totalComponents > 0 && (
            <Progress
              type="circle"
              percent={progressPercent}
              size={40}
              strokeColor={allFound ? "var(--status-complete)" : "var(--wf-primary)"}
              style={{ marginLeft: "auto" }}
            />
          )}
        </Flex>
      }
    >
      {loadingDrops ? (
        <Flex justify="center" style={{ padding: 32 }}>
          <Spin />
        </Flex>
      ) : droppableComponents.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("noResults")} />
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>{t("relicRefinement")}:</Text>
            <Segmented
              size="small"
              value={refinementLevel}
              onChange={setRefinementLevel}
              options={REFINEMENT_LEVELS.map((level) => ({
                value: level,
                label: t(`refinement${level}`),
              }))}
            />
          </div>
          <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 10, fontStyle: "italic" }}>
            {t("refinementHint")}
          </Text>
          <Collapse
            activeKey={componentActiveKeys}
            onChange={setComponentActiveKeys}
            size="small"
            items={droppableComponents.map((comp) => {
              const isFound = !!foundMap[comp.componentName];
              const groupedRelics = groupDropsByRelic(comp.drops);
              return {
                key: comp.componentName,
                label: (
                  <Flex align="center" justify="space-between" style={{ width: "100%" }}>
                    <Text style={{ textDecoration: isFound ? "line-through" : "none", opacity: isFound ? 0.5 : 1 }}>
                      {comp.componentName}
                    </Text>
                    <Button
                      size="small"
                      type={isFound ? "primary" : "default"}
                      icon={isFound ? <CheckOutlined /> : null}
                      className={`relic-found-btn ${isFound ? "found" : ""}`}
                      onClick={(e) => { e.stopPropagation(); onToggleFound(prime.uniqueName, comp.componentName); }}
                      style={isFound ? { background: "var(--status-complete)", borderColor: "var(--status-complete)" } : {}}
                    >
                      {isFound ? t("componentFound") : t("componentMissing")}
                    </Button>
                  </Flex>
                ),
                children: (
                  <div style={{ maxHeight: 200, overflowY: "auto" }}>
                  <List
                    size="small"
                    dataSource={groupedRelics}
                    renderItem={(relic) => {
                      const chance = relic.byRefinement[refinementLevel] ?? relic.byRefinement["Intact"] ?? null;
                      return (
                        <List.Item style={{ padding: "4px 0", border: "none" }}>
                          <Flex align="center" gap={6} style={{ width: "100%" }}>
                            <GoldOutlined style={{ color: "var(--accent-gold)", fontSize: 11 }} />
                            <Text style={{ flex: 1, fontSize: 12 }} ellipsis>
                              {relic.baseName}
                            </Text>
                            {relic.rarity && (
                              <Tag
                                color={rarityColors[relic.rarity] || "default"}
                                style={{ fontSize: 10, lineHeight: "16px", margin: 0 }}
                              >
                                {relic.rarity}
                              </Tag>
                            )}
                            {chance != null && (
                              <Text
                                type="secondary"
                                style={{ fontSize: 11, fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}
                              >
                                {Number(chance).toFixed(1)}%
                              </Text>
                            )}
                          </Flex>
                        </List.Item>
                      );
                    }}
                  />
                  </div>
                ),
              };
            })}
          />
          {allFound && (
            <div style={{ padding: "12px 0", textAlign: "center" }}>
              <Tag color="success" icon={<CheckOutlined />}>{t("allPartsFound")}</Tag>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

export default function RelicCardGrid({ watchedPrimes, foundComponents, onToggleFound, onRemovePrime }) {
  const { t } = useTranslate();
  const [modalPrime, setModalPrime] = useState(null);

  // Sort: incomplete first, completed last (based on foundComponents only, drop data is per-card via React Query)
  const sortedPrimes = useMemo(() => {
    return [...watchedPrimes].sort((a, b) => {
      const aFound = foundComponents[a.uniqueName] || {};
      const bFound = foundComponents[b.uniqueName] || {};
      const aFoundCount = Object.values(aFound).filter(Boolean).length;
      const bFoundCount = Object.values(bFound).filter(Boolean).length;
      // Items with no found components go first
      if (aFoundCount === 0 && bFoundCount > 0) return -1;
      if (bFoundCount === 0 && aFoundCount > 0) return 1;
      return 0;
    });
  }, [watchedPrimes, foundComponents]);

  if (watchedPrimes.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<Text type="secondary">{t("noWatchedPrimes")}</Text>}
        />
      </div>
    );
  }

  return (
    <>
      <div className="item-card-grid">
          {sortedPrimes.map((prime) => (
            <RelicPrimeCard
              key={prime.uniqueName}
              prime={prime}
              foundMap={foundComponents[prime.uniqueName] || {}}
              onToggleFound={onToggleFound}
              onRemove={onRemovePrime}
              onOpenModal={setModalPrime}
            />
          ))}
        </div>

      <RelicDetailModal
        prime={modalPrime}
        open={!!modalPrime}
        onClose={() => setModalPrime(null)}
        foundMap={modalPrime ? (foundComponents[modalPrime.uniqueName] || {}) : {}}
        onToggleFound={onToggleFound}
      />
    </>
  );
}
