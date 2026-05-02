import { useMemo, useState } from "react";
import { InputNumber, Progress, Tag, Tooltip, Segmented } from "antd";
import {
  ExperimentFilled,
  SearchOutlined,
  CheckCircleFilled,
  PlusOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useTranslate } from "../../hooks/useTranslate";
import type { TranslateFn } from "../../hooks/useTranslate";
import { useArcaneStore } from "../../stores/arcaneStore";
import {
  ARCANES,
  ARCANE_ZONES,
  ARCANE_MAX_COPIES,
  ARCANE_MAX_RANK,
  ARCANE_FALLBACK_IMAGE,
  getRequiredForRank,
  isArcaneMaxed,
} from "../../constants/arcanes";
import type { Arcane } from "../../constants/arcanes";
import EmptyState from "../shared/EmptyState";

const ZONE_TINTS: Record<string, string> = {
  Eidolon: "var(--wf-primary)",
  Zariman: "#a78bfa",   // void purple
  Entrati: "#22d3ee",   // deimos cyan
  Other:   "#9ca3af",
};

function handleImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const target = e.target as HTMLImageElement;
  if (target.dataset.fallback === "1") {
    target.style.display = "none";
    return;
  }
  target.dataset.fallback = "1";
  target.src = ARCANE_FALLBACK_IMAGE;
}

interface ArcaneCardProps {
  arcane: Arcane;
  count: number;
  onChange: (value: number) => void;
  t: TranslateFn;
}

function ArcaneCard({ arcane, count, onChange, t }: ArcaneCardProps) {
  const tint = ZONE_TINTS[arcane.zone] || "var(--wf-primary)";
  const { currentRank, copiesNeeded } = getRequiredForRank(count, ARCANE_MAX_RANK);
  const maxed = isArcaneMaxed(count);
  const pct = Math.min(100, Math.round((count / ARCANE_MAX_COPIES) * 100));

  return (
    <motion.div
      className={`arc-card ${maxed ? "arc-card-maxed" : ""}`}
      style={{ ["--zone-tint" as any]: tint }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div className="arc-card-head">
        <div className="arc-card-img-wrap">
          <img
            className="arc-card-img"
            src={arcane.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            onError={handleImgError}
          />
          {maxed && (
            <span className="arc-card-maxed-badge" aria-label={t("arcMaxed")}>
              <CheckCircleFilled />
            </span>
          )}
        </div>
        <div className="arc-card-titles">
          <div className="arc-card-name">{arcane.name}</div>
          <Tag className="arc-card-zone" style={{ color: tint, borderColor: tint }}>
            {t(getZoneLabelKey(arcane.zone))}
          </Tag>
        </div>
      </div>

      <div className="arc-card-counter">
        <Tooltip title={t("arcDecrement")}>
          <button
            type="button"
            className="arc-counter-btn"
            disabled={count <= 0}
            onClick={() => onChange(Math.max(0, count - 1))}
            aria-label={t("arcDecrement")}
          >
            <MinusOutlined />
          </button>
        </Tooltip>
        <InputNumber
          className="arc-card-input"
          min={0}
          max={ARCANE_MAX_COPIES}
          value={count}
          onChange={(v) => onChange(v ?? 0)}
          controls={false}
          aria-label={t("arcOwnedLabel", { name: arcane.name })}
        />
        <Tooltip title={t("arcIncrement")}>
          <button
            type="button"
            className="arc-counter-btn"
            disabled={count >= ARCANE_MAX_COPIES}
            onClick={() => onChange(Math.min(ARCANE_MAX_COPIES, count + 1))}
            aria-label={t("arcIncrement")}
          >
            <PlusOutlined />
          </button>
        </Tooltip>
        <span className="arc-card-of-max">/ {ARCANE_MAX_COPIES}</span>
      </div>

      <div className="arc-card-progress">
        <Progress
          percent={pct}
          showInfo={false}
          size="small"
          strokeColor={tint}
          trailColor="var(--wf-border)"
        />
        <div className="arc-card-rank">R{currentRank}</div>
      </div>

      <div className="arc-card-footer">
        {maxed
          ? <span className="arc-card-footer-done">{t("arcRank5Done")}</span>
          : <span>{t("arcCopiesNeeded", { count: copiesNeeded })}</span>
        }
      </div>
    </motion.div>
  );
}

function getZoneLabelKey(zoneId: string): string {
  const z = ARCANE_ZONES.find((zone) => zone.id === zoneId);
  return z ? z.labelKey : "arcZoneOther";
}

export default function ArcaneTrackerPage() {
  const { t } = useTranslate();
  const arcaneCounts = useArcaneStore((s) => s.arcaneCounts);
  const setCount = useArcaneStore((s) => s.setCount);

  const [search, setSearch] = useState<string>("");
  const [zone, setZone] = useState<string>("all");

  // Top-level stats
  const totalOwned = useMemo(() => {
    return Object.values(arcaneCounts).reduce<number>((sum, n) => sum + (Number(n) || 0), 0);
  }, [arcaneCounts]);

  const fullyMaxedCount = useMemo(() => {
    return ARCANES.filter((a) => isArcaneMaxed(arcaneCounts[a.id] || 0)).length;
  }, [arcaneCounts]);

  // Visible list after search/zone filtering
  const visibleArcanes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ARCANES.filter((a) => {
      if (zone !== "all" && a.zone !== zone) return false;
      if (q && !a.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, zone]);

  const zoneOptions = useMemo(() => {
    return [
      { label: t("arcZoneAll"), value: "all" },
      ...ARCANE_ZONES.map((z) => ({ label: t(z.labelKey), value: z.id })),
    ];
  }, [t]);

  return (
    <div className="arc-page">
      <div className="arc-header">
        <div className="arc-header-icon"><ExperimentFilled /></div>
        <div>
          <h1 className="arc-title">{t("arcTitle")}</h1>
          <p className="arc-subtitle">{t("arcSubtitle")}</p>
        </div>
      </div>

      {/* Top stat row */}
      <div className="summary-bar arc-summary">
        <motion.div className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="stat-label">{t("arcStatTotalOwned")}</div>
          <div className="stat-value">{totalOwned}</div>
          <div className="stat-sub">{t("arcStatTotalOwnedSub")}</div>
        </motion.div>

        <motion.div className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="stat-label">{t("arcStatMaxed")}</div>
          <div className="stat-value" style={{ color: "var(--wf-primary)" }}>
            {fullyMaxedCount} / {ARCANES.length}
          </div>
          <Progress
            percent={ARCANES.length > 0 ? Math.round((fullyMaxedCount / ARCANES.length) * 100) : 0}
            showInfo={false}
            size="small"
            strokeColor="var(--wf-primary)"
            trailColor="var(--wf-border)"
            style={{ marginTop: 8 }}
          />
        </motion.div>

        <motion.div className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-label">{t("arcStatCatalog")}</div>
          <div className="stat-value">{ARCANES.length}</div>
          <div className="stat-sub">{t("arcStatCatalogSub")}</div>
        </motion.div>
      </div>

      {/* Toolbar: search + zone filter */}
      <div className="arc-toolbar">
        <div className="arc-search">
          <SearchOutlined className="arc-search-icon" />
          <input
            type="text"
            className="arc-search-input"
            placeholder={t("arcSearchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="arc-search-clear" onClick={() => setSearch("")} aria-label={t("clearAll")}>
              &times;
            </button>
          )}
        </div>
        <Segmented
          value={zone}
          onChange={(v) => setZone(String(v))}
          options={zoneOptions}
        />
      </div>

      {/* Card grid */}
      {visibleArcanes.length === 0 ? (
        <EmptyState
          icon="search"
          title={t("arcEmptyTitle")}
          description={t("arcEmptyDesc")}
          ctaLabel={t("arcEmptyCta")}
          onCta={() => { setSearch(""); setZone("all"); }}
          compact
        />
      ) : (
        <div className="arc-grid">
          {visibleArcanes.map((arcane) => (
            <ArcaneCard
              key={arcane.id}
              arcane={arcane}
              count={arcaneCounts[arcane.id] || 0}
              onChange={(value) => setCount(arcane.id, value)}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}
