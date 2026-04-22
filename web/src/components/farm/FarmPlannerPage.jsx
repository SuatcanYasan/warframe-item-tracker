import { useMemo, useState } from "react";
import { AutoComplete, InputNumber, Button, Empty, Tag, Modal, Skeleton, Spin, Input, Switch } from "antd";
import {
  SearchOutlined,
  ToolOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { useQueries, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { requestJson, FALLBACK_ICON, handleImgError } from "../../utils/helpers";
import { useTranslate } from "../../hooks/useTranslate";
import { useFarmStore } from "../../stores/farmStore";

const RARITY_COLOR = {
  Common: "default",
  Uncommon: "green",
  Rare: "blue",
  Legendary: "gold",
};

function parsePlace(place) {
  if (!place) return { raw: "", key: "", planet: "", node: "", type: "", rotation: "" };
  const rotMatch = place.match(/,\s*Rot\s*([A-Z])/i);
  const rotation = rotMatch ? rotMatch[1] : "";
  const withoutRot = place.replace(/,\s*Rot\s*[A-Z]/i, "").trim();
  const typeMatch = withoutRot.match(/\(([^)]+)\)/);
  const type = typeMatch ? typeMatch[1] : "";
  const locationPart = withoutRot.replace(/\s*\([^)]+\)/, "").trim();
  const [planet, ...nodeParts] = locationPart.split("/");
  return {
    raw: place,
    // Stable key per (location + type + rotation) for grouping
    key: `${planet}/${nodeParts.join("/")}|${type}|${rotation}`,
    planet: planet?.trim() || "",
    node: nodeParts.join("/").trim() || planet?.trim() || "",
    type,
    rotation,
  };
}

function DropInfoModal({ resource, onClose, t }) {
  const open = !!resource;
  const { data: drops, isLoading } = useQuery({
    queryKey: ["farm-drops-detail", resource?.name?.toLowerCase()],
    queryFn: () => requestJson(`/api/drops/search/${encodeURIComponent(resource.name)}`),
    enabled: open,
    staleTime: 30 * 60 * 1000,
    retry: 0,
  });

  const sorted = useMemo(
    () => (Array.isArray(drops) ? [...drops].sort((a, b) => (b.chance || 0) - (a.chance || 0)) : []),
    [drops],
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      title={resource ? (
        <span>
          <EnvironmentOutlined style={{ marginRight: 8, color: "var(--wf-primary)" }} />
          {resource.name}
        </span>
      ) : ""}
      destroyOnHidden
    >
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 24 }}><Spin /></div>
      ) : sorted.length === 0 ? (
        <Empty description={t("farmNoDropsForItem")} />
      ) : (
        <div className="farm-drop-list">
          {sorted.map((d, i) => {
            const p = parsePlace(d.place);
            return (
              <div key={i} className="farm-drop-row">
                <div className="farm-drop-location">
                  <div className="farm-drop-node">
                    <span className="farm-drop-planet">{p.planet}</span>
                    {p.node && p.node !== p.planet && <span> / {p.node}</span>}
                  </div>
                  {p.type && <div className="farm-drop-type">{p.type}</div>}
                </div>
                <div className="farm-drop-meta">
                  {p.rotation && <Tag color="purple">Rot {p.rotation}</Tag>}
                  {d.rarity && <Tag color={RARITY_COLOR[d.rarity] || "default"}>{d.rarity}</Tag>}
                  <span className="farm-drop-chance">%{Number(d.chance || 0).toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

function LocationRow({ loc, t }) {
  return (
    <div className="farm-common-row">
      <div className="farm-common-location">
        <div className="farm-drop-node">
          <span className="farm-drop-planet">{loc.place.planet}</span>
          {loc.place.node && loc.place.node !== loc.place.planet && (
            <span> / {loc.place.node}</span>
          )}
        </div>
        <div className="farm-common-meta-line">
          {loc.place.type && <span className="farm-drop-type">{loc.place.type}</span>}
          {loc.place.rotation && <Tag color="purple">Rot {loc.place.rotation}</Tag>}
          {loc.resources.length >= 2 && (
            <span className="farm-common-covers">
              {t("farmCovers", { count: loc.resources.length })}
            </span>
          )}
        </div>
      </div>
      <div className="farm-common-resources">
        {loc.resources.map((r, j) => (
          <div key={j} className="farm-common-resource">
            <img
              src={r.resource.imageUrl || FALLBACK_ICON}
              alt=""
              className="farm-common-resource-img"
              data-img-fallback={r.resource.imageUrlFallback || undefined}
              onError={handleImgError} loading="lazy" decoding="async" />
            <span className="farm-common-resource-name">{r.resource.name}</span>
            {r.rarity && <Tag color={RARITY_COLOR[r.rarity] || "default"}>{r.rarity}</Tag>}
            <span className="farm-drop-chance">%{Number(r.chance || 0).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FarmPlannerPage() {
  const { t } = useTranslate();
  const trackedResources = useFarmStore((s) => s.trackedResources);
  const addResource = useFarmStore((s) => s.addResource);
  const removeResource = useFarmStore((s) => s.removeResource);
  const updateTarget = useFarmStore((s) => s.updateTarget);

  const [query, setQuery] = useState("");
  const [infoFor, setInfoFor] = useState(null);
  const [showCaches, setShowCaches] = useState(true);

  const { data: resourceSearch } = useQuery({
    queryKey: ["farm-resource-search", query.trim().toLowerCase()],
    queryFn: () => requestJson(`/api/resources/search?search=${encodeURIComponent(query.trim())}&limit=15`),
    enabled: query.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch drop data for every tracked resource in parallel (each cached 30m)
  const dropQueries = useQueries({
    queries: trackedResources.map((r) => ({
      queryKey: ["farm-drops", r.name.toLowerCase()],
      queryFn: () => requestJson(`/api/drops/search/${encodeURIComponent(r.name)}`),
      staleTime: 30 * 60 * 1000,
      retry: 0,
    })),
  });

  // Build a map of unique location → { place, resources: [{resource, rarity, chance}] }
  // Locations that drop 2+ DISTINCT tracked resources bubble to the top.
  // Within a location, if the same resource has multiple rarity entries
  // (e.g. Argon Crystal Rot C: Uncommon 19.36% AND Rare 3.76%), collapse to
  // the single highest-chance entry so it's counted once.
  const combinedLocations = useMemo(() => {
    const byLocation = new Map();
    dropQueries.forEach((q, i) => {
      const resource = trackedResources[i];
      if (!resource || !Array.isArray(q.data)) return;
      for (const d of q.data) {
        const p = parsePlace(d.place);
        const entry = byLocation.get(p.key) || { place: p, byResource: new Map() };
        const existing = entry.byResource.get(resource.uniqueName);
        const chance = Number(d.chance) || 0;
        if (!existing || chance > (Number(existing.chance) || 0)) {
          entry.byResource.set(resource.uniqueName, {
            resource,
            rarity: d.rarity,
            chance: d.chance,
          });
        }
        byLocation.set(p.key, entry);
      }
    });

    return Array.from(byLocation.values())
      .map((l) => ({ place: l.place, resources: Array.from(l.byResource.values()) }))
      .filter((l) => l.resources.length > 0)
      // Real star-chart nodes parse to a distinct planet/node (Deimos/Formido).
      // Event drops ("Hallowed Flame Mission Caches") and enemy drops
      // ("Corrupted Vor") have no slash, so parsePlace returns planet === node.
      .filter((l) => l.place.planet && l.place.node && l.place.planet !== l.place.node)
      .filter((l) => showCaches || !/caches?/i.test(l.place.type || ""))
      .sort((a, b) => {
        if (b.resources.length !== a.resources.length) {
          return b.resources.length - a.resources.length;
        }
        const aBest = Math.max(...a.resources.map((r) => r.chance || 0));
        const bBest = Math.max(...b.resources.map((r) => r.chance || 0));
        return bBest - aBest;
      });
  }, [dropQueries, trackedResources, showCaches]);

  const multiDrop = combinedLocations.filter((l) => l.resources.length >= 2);
  const singleDrop = combinedLocations.filter((l) => l.resources.length === 1);

  const autocompleteOptions = (resourceSearch?.results || []).map((r) => ({
    value: r.name,
    label: (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <img
          src={r.imageUrl || FALLBACK_ICON}
          alt=""
          style={{ width: 24, height: 24, objectFit: "contain" }}
          data-img-fallback={r.imageUrlFallback || undefined}
          onError={handleImgError} loading="lazy" decoding="async" />
        <span>{r.name}</span>
      </div>
    ),
    resource: r,
  }));

  function handleSelect(value, option) {
    if (option?.resource) {
      addResource(option.resource);
      setQuery("");
    }
  }

  const anyLoading = dropQueries.some((q) => q.isLoading);

  return (
    <div className="farm-page">
      <div className="activities-header">
        <div className="activities-header-icon-wrap">
          <ToolOutlined className="activities-header-icon" />
        </div>
        <div>
          <h1 className="activities-title">{t("farmPlannerTitle")}</h1>
          <p className="activities-subtitle">{t("farmPlannerSubtitle")}</p>
        </div>
      </div>

      <div className="farm-search">
        <AutoComplete
          value={query}
          onChange={setQuery}
          onSelect={handleSelect}
          options={autocompleteOptions}
          allowClear
          size="large"
          style={{ flex: 1 }}
          popupMatchSelectWidth={420}
          notFoundContent={query.trim().length >= 2 ? t("farmNoResource") : null}
        >
          <Input
            prefix={<SearchOutlined />}
            placeholder={t("farmSearchPlaceholder")}
            size="large"
          />
        </AutoComplete>
      </div>

      {trackedResources.length === 0 ? (
        <Empty description={t("farmTrackedEmptyHint")} />
      ) : (
        <>
          <div className="farm-resource-grid">
            <AnimatePresence mode="popLayout">
              {trackedResources.map((r) => (
                <motion.div
                  key={r.uniqueName}
                  className="farm-resource-card"
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <img
                    src={r.imageUrl || FALLBACK_ICON}
                    alt=""
                    className="farm-resource-img"
                    data-img-fallback={r.imageUrlFallback || undefined}
                    onError={handleImgError} loading="lazy" decoding="async" />
                  <div className="farm-resource-body">
                    <div className="farm-resource-name">{r.name}</div>
                    <div className="farm-resource-target-row">
                      <span className="farm-resource-target-label">{t("farmTargetLabel")}</span>
                      <InputNumber
                        min={1}
                        max={9999}
                        value={r.target}
                        onChange={(v) => updateTarget(r.uniqueName, v)}
                        size="small"
                        style={{ width: 80 }}
                      />
                    </div>
                  </div>
                  <div className="farm-resource-actions">
                    <Button
                      type="text"
                      size="small"
                      icon={<InfoCircleOutlined />}
                      onClick={() => setInfoFor(r)}
                      title={t("farmDropInfoTitle")}
                    />
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeResource(r.uniqueName)}
                      title={t("farmRemove")}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="farm-filter-row">
            <span className="farm-filter-label">{t("farmShowCaches")}</span>
            <Switch
              size="small"
              checked={showCaches}
              onChange={setShowCaches}
            />
          </div>

          {anyLoading && <Skeleton active paragraph={{ rows: 3 }} />}

          {!anyLoading && multiDrop.length > 0 && (
            <div className="farm-common-section">
              <div className="farm-common-title">
                🏆 {t("farmCommonLocationsTitle")}
                <span className="farm-common-count">{multiDrop.length}</span>
              </div>
              <p className="farm-common-hint">{t("farmCommonLocationsHint")}</p>
              <div className="farm-common-list">
                {multiDrop.slice(0, 30).map((loc, i) => (
                  <LocationRow key={i} loc={loc} t={t} />
                ))}
              </div>
            </div>
          )}

          {!anyLoading && multiDrop.length === 0 && singleDrop.length > 0 && (
            <div className="farm-common-section">
              <div className="farm-common-title">
                {t("farmAllLocationsTitle")}
                <span className="farm-common-count">{singleDrop.length}</span>
              </div>
              <div className="farm-common-list">
                {singleDrop.slice(0, 30).map((loc, i) => (
                  <LocationRow key={i} loc={loc} t={t} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <DropInfoModal
        resource={infoFor}
        onClose={() => setInfoFor(null)}
        t={t}
      />
    </div>
  );
}
