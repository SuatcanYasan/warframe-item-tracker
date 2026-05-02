import { useMemo, useState } from "react";
import { Button, Empty, Tooltip, Modal, Tag, Spin, Empty as AntEmpty } from "antd";
import {
  CheckOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FALLBACK_ICON, requestJson, handleImgError } from "../../../utils/helpers";
import { useTranslate } from "../../../hooks/useTranslate";
import { useAmpStore } from "../../../stores/ampStore";
import EmptyState from "../../shared/EmptyState";

const rarityColors = {
  Common: "default",
  Uncommon: "green",
  Rare: "blue",
  Legendary: "gold",
};

function resolveImage(slotPart, allParts) {
  if (!slotPart) return FALLBACK_ICON;
  const full = allParts.find((p) => p.uniqueName === slotPart.uniqueName);
  return full?.imageUrl || FALLBACK_ICON;
}

function SetCard({ set, allParts, onRemove, onTogglePart, t }) {
  const parts = [
    { key: "prism", data: set.prism, labelKey: "ampPrism" },
    { key: "scaffold", data: set.scaffold, labelKey: "ampScaffold" },
    { key: "brace", data: set.brace, labelKey: "ampBrace" },
  ];
  const doneCount = parts.filter((p) => p.data.done).length;
  const pct = Math.round((doneCount / parts.length) * 100);
  const allDone = doneCount === parts.length;

  return (
    <motion.div
      className={`amp-set-card ${allDone ? "complete" : ""}`}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25 }}
    >
      <div className="amp-set-card-header">
        <div className="amp-set-code">{set.code}</div>
        <div className="amp-set-progress-pill">{doneCount}/{parts.length}</div>
        <Tooltip title={t("ampTrackerRemoveTip")}>
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => onRemove(set.id)} className="amp-set-remove" />
        </Tooltip>
      </div>
      <div className="amp-set-progress-bar">
        <div className="amp-set-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="amp-set-parts">
        {parts.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`amp-set-part ${p.data.done ? "done" : ""}`}
            onClick={() => onTogglePart(set.id, p.key)}
          >
            <div className="amp-set-part-check">{p.data.done && <CheckOutlined />}</div>
            <img src={resolveImage(p.data, allParts)} alt="" className="amp-set-part-img" onError={handleImgError} loading="lazy" decoding="async" />
            <div className="amp-set-part-info">
              <div className="amp-set-part-slot">{t(p.labelKey)}</div>
              <div className="amp-set-part-name">
                <span className="amp-set-part-num">{p.data.number === 0 ? "M" : p.data.number}</span>
                {p.data.name}
              </div>
            </div>
          </button>
        ))}
      </div>
      {allDone && (
        <div className="amp-set-complete-banner">
          <CheckOutlined /> {t("ampSetComplete")}
        </div>
      )}
    </motion.div>
  );
}

export default function AmpTrackerTab({ allParts, onGoToBuilder }) {
  const { t } = useTranslate();
  const trackedSets = useAmpStore((s) => s.trackedSets);
  const removeTrackedSet = useAmpStore((s) => s.removeTrackedSet);
  const togglePartDone = useAmpStore((s) => s.togglePartDone);
  const completedMaterials = useAmpStore((s) => s.completedMaterials);
  const toggleMaterialDone = useAmpStore((s) => s.toggleMaterialDone);
  const [dropModalFor, setDropModalFor] = useState(null); // { uniqueName, name }

  const sortedSets = useMemo(
    () => [...trackedSets].sort((a, b) => b.createdAt - a.createdAt),
    [trackedSets],
  );

  const totalSets = trackedSets.length;
  const completedSets = trackedSets.filter((s) => s.prism.done && s.scaffold.done && s.brace.done).length;
  const totalParts = totalSets * 3;
  const donePartsCount = trackedSets.reduce(
    (sum, s) => sum + (s.prism.done ? 1 : 0) + (s.scaffold.done ? 1 : 0) + (s.brace.done ? 1 : 0),
    0,
  );

  function handleRemove(id) {
    removeTrackedSet(id);
    toast.success(t("ampTrackerRemoved"));
  }

  function handleToggle(setId, slot) {
    const content = document.querySelector(".app-content");
    const scrollTop = content?.scrollTop || 0;
    togglePartDone(setId, slot);
    requestAnimationFrame(() => {
      if (content) content.scrollTop = scrollTop;
    });
  }

  // Aggregate materials required for remaining (undone) parts across all sets
  const neededMaterials = useMemo(() => {
    const map = new Map();
    for (const s of trackedSets) {
      for (const slot of ["prism", "scaffold", "brace"]) {
        const part = s[slot];
        if (!part || part.done) continue;
        const full = allParts.find((p) => p.uniqueName === part.uniqueName);
        if (!full?.components) continue;
        for (const comp of full.components) {
          const key = comp.uniqueName || comp.name;
          if (!key) continue;
          // Skip per-part blueprints — each amp part has its own, noisy in a total list
          if (comp.name && /blueprint/i.test(comp.name)) continue;
          const prev = map.get(key) || { ...comp, itemCount: 0 };
          map.set(key, {
            uniqueName: comp.uniqueName,
            name: comp.name,
            itemCount: (prev.itemCount || 0) + (comp.itemCount || 1),
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [trackedSets, allParts]);

  const materialUns = useMemo(
    () => neededMaterials.map((m) => m.uniqueName).filter(Boolean),
    [neededMaterials],
  );
  const { data: materialMeta } = useQuery({
    queryKey: ["tracker-materials", materialUns.slice().sort().join("|")],
    queryFn: () =>
      requestJson("/api/items/resolve-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueNames: materialUns }),
      }),
    enabled: materialUns.length > 0,
    staleTime: 10 * 60 * 1000,
  });
  const metaByUn = materialMeta?.itemsByUniqueName || {};

  if (totalSets === 0) {
    return (
      <EmptyState
        icon="amp"
        title={t("emptyAmpTitle")}
        description={t("emptyAmpDesc")}
        ctaLabel={t("emptyAmpCta")}
        onCta={onGoToBuilder}
      />
    );
  }

  return (
    <div className="amp-tracker">
      <div className="amp-tracker-stats">
        <div className="amp-stat">
          <div className="amp-stat-value">{totalSets}</div>
          <div className="amp-stat-label">{t("ampStatTrackedSets")}</div>
        </div>
        <div className="amp-stat amp-stat-gilded">
          <div className="amp-stat-value">{completedSets}</div>
          <div className="amp-stat-label">{t("ampStatCompletedSets")}</div>
        </div>
        <div className="amp-stat amp-stat-owned">
          <div className="amp-stat-value">{donePartsCount}/{totalParts}</div>
          <div className="amp-stat-label">{t("ampStatPartsDone")}</div>
        </div>
      </div>
      <p className="amp-tracker-hint">{t("ampTrackerSetHint")}</p>
      <div className="amp-set-grid">
        <AnimatePresence mode="popLayout">
          {sortedSets.map((set) => (
            <SetCard key={set.id} set={set} allParts={allParts} onRemove={handleRemove} onTogglePart={handleToggle} t={t} />
          ))}
        </AnimatePresence>
      </div>

      {neededMaterials.length > 0 && (
        <div className="amp-builder-materials amp-tracker-materials">
          <div className="amp-builder-materials-title">
            {t("ampTrackerMaterialsTitle")}
            <span className="amp-tracker-materials-count">
              {neededMaterials.filter((m) => completedMaterials[m.uniqueName]).length}/{neededMaterials.length}
            </span>
          </div>
          <p className="amp-tracker-materials-hint">{t("ampTrackerMaterialsHint")}</p>
          <div className="amp-builder-materials-grid">
            {neededMaterials.map((m) => {
              const img = metaByUn[m.uniqueName]?.imageUrl || FALLBACK_ICON;
              const done = !!completedMaterials[m.uniqueName];
              return (
                <div
                  key={m.uniqueName || m.name}
                  className={`amp-material-item amp-material-clickable ${done ? "done" : ""}`}
                  onClick={() => m.uniqueName && toggleMaterialDone(m.uniqueName)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="amp-material-check">{done && <CheckOutlined />}</div>
                  <img
                    src={img}
                    alt=""
                    className="amp-material-img"
                    onError={handleImgError} loading="lazy" decoding="async" />
                  <span className="amp-material-name">{m.name}</span>
                  <span className="amp-material-qty">×{m.itemCount}</span>
                  {m.uniqueName && (
                    <button
                      type="button"
                      className="amp-material-info-btn"
                      title={t("ampMaterialInfoTitle")}
                      onClick={(e) => { e.stopPropagation(); setDropModalFor({ uniqueName: m.uniqueName, name: m.name }); }}
                    >
                      <InfoCircleOutlined />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <MaterialDropModal
        material={dropModalFor}
        onClose={() => setDropModalFor(null)}
        t={t}
      />
    </div>
  );
}

function MaterialDropModal({ material, onClose, t }) {
  const open = !!material;
  const { data, isLoading } = useQuery({
    queryKey: ["material-drops", material?.uniqueName],
    queryFn: () =>
      requestJson(`/api/items/drops/${encodeURIComponent(material.uniqueName)}`),
    enabled: open,
    staleTime: 10 * 60 * 1000,
    retry: 0,
  });

  const drops = (data?.drops || []).slice().sort((a, b) => (b.chance || 0) - (a.chance || 0));

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        <span>
          <EnvironmentOutlined style={{ marginRight: 8, color: "var(--wf-primary)" }} />
          {material?.name}
        </span>
      }
      width={560}
    >
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 24 }}><Spin /></div>
      ) : drops.length === 0 ? (
        <AntEmpty description={t("ampMaterialNoDrops")} />
      ) : (
        <div className="amp-drop-list">
          {drops.map((d, i) => (
            <div key={i} className="amp-drop-row">
              <div className="amp-drop-location">{d.location}</div>
              <div className="amp-drop-meta">
                {d.rarity && (
                  <Tag color={rarityColors[d.rarity] || "default"}>{d.rarity}</Tag>
                )}
                {d.chance != null && (
                  <span className="amp-drop-chance">%{Number(d.chance).toFixed(2)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
