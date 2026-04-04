import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Button, Collapse, Empty, Flex, List, Modal, Progress, Segmented, Spin, Tag, Typography,
} from "antd";
import {
  CheckOutlined, DeleteOutlined, GoldOutlined,
} from "@ant-design/icons";
import { FALLBACK_ICON, requestJson } from "../utils/helpers";

const { Text } = Typography;

const rarityColors = { Common: "default", Uncommon: "green", Rare: "blue", Legendary: "gold" };
const REFINEMENT_LEVELS = ["Intact", "Exceptional", "Flawless", "Radiant"];

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
  return Array.from(grouped.values());
}

function RelicPrimeCard({ prime, foundMap, onToggleFound, onRemove, t, tin, dropCache, setDropCache, onOpenModal }) {
  // Auto-fetch drops on mount if not cached
  useEffect(() => {
    if (dropCache[prime.uniqueName]) return;
    let cancelled = false;
    requestJson(`/api/items/drops/${encodeURIComponent(prime.uniqueName)}`)
      .then((result) => {
        if (!cancelled) setDropCache((prev) => ({ ...prev, [prime.uniqueName]: result }));
      })
      .catch(() => {
        if (!cancelled) setDropCache((prev) => ({ ...prev, [prime.uniqueName]: { componentDrops: [] } }));
      });
    return () => { cancelled = true; };
  }, [prime.uniqueName, dropCache, setDropCache]);

  const dropData = dropCache[prime.uniqueName] || null;
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
          onError={(e) => { e.target.src = FALLBACK_ICON; }}
        />
        {allFound && <span className="item-card-done-badge">{t("allPartsFound")}</span>}
      </div>
      <div className="item-card-body">
        <div className="item-card-name">{tin(prime.uniqueName, prime.name)}</div>
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

function RelicDetailModal({ prime, open, onClose, foundMap, onToggleFound, t, tin, dropCache, setDropCache }) {
  const [loadingDrops, setLoadingDrops] = useState(false);
  const [componentActiveKeys, setComponentActiveKeys] = useState([]);
  const [refinementLevel, setRefinementLevel] = useState("Intact");

  const dropData = dropCache[prime?.uniqueName] || null;

  useEffect(() => {
    if (!open || !prime || dropCache[prime.uniqueName]) return;
    let cancelled = false;
    setLoadingDrops(true);
    requestJson(`/api/items/drops/${encodeURIComponent(prime.uniqueName)}`)
      .then((result) => {
        if (!cancelled) setDropCache((prev) => ({ ...prev, [prime.uniqueName]: result }));
      })
      .catch(() => {
        if (!cancelled) setDropCache((prev) => ({ ...prev, [prime.uniqueName]: { componentDrops: [] } }));
      })
      .finally(() => {
        if (!cancelled) setLoadingDrops(false);
      });
    return () => { cancelled = true; };
  }, [open, prime?.uniqueName]);

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
            <Text strong style={{ fontSize: 16 }}>{tin(prime.uniqueName, prime.name)}</Text>
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
              strokeColor={allFound ? "var(--status-complete)" : "var(--accent-cyan)"}
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
              options={REFINEMENT_LEVELS.map((level) => ({ value: level, label: level }))}
            />
          </div>
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

export default function RelicCardGrid({ t, tin, watchedPrimes, foundComponents, onToggleFound, onRemovePrime }) {
  const [dropCache, setDropCache] = useState({});
  const [modalPrime, setModalPrime] = useState(null);

  // Sort: incomplete first, completed last
  const sortedPrimes = useMemo(() => {
    return [...watchedPrimes].sort((a, b) => {
      const aFound = foundComponents[a.uniqueName] || {};
      const bFound = foundComponents[b.uniqueName] || {};
      const aDrops = dropCache[a.uniqueName]?.componentDrops?.filter((c) => c.drops?.length > 0) || [];
      const bDrops = dropCache[b.uniqueName]?.componentDrops?.filter((c) => c.drops?.length > 0) || [];
      const aAllDone = aDrops.length > 0 && aDrops.every((c) => aFound[c.componentName]);
      const bAllDone = bDrops.length > 0 && bDrops.every((c) => bFound[c.componentName]);
      if (aAllDone !== bAllDone) return aAllDone ? 1 : -1;
      return 0;
    });
  }, [watchedPrimes, foundComponents, dropCache]);

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
              t={t}
              tin={tin}
              dropCache={dropCache}
              setDropCache={setDropCache}
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
        t={t}
        tin={tin}
        dropCache={dropCache}
        setDropCache={setDropCache}
      />
    </>
  );
}
