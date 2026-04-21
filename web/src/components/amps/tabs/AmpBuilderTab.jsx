import { useMemo, useState } from "react";
import { Button, Select, Tooltip } from "antd";
import { AimOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FALLBACK_ICON, requestJson } from "../../../utils/helpers";
import { useTranslate } from "../../../hooks/useTranslate";
import { useAmpStore } from "../../../stores/ampStore";

function buildCode(prism, scaffold, brace) {
  const n = (p) => (p ? (p.number === 0 ? "M" : p.number) : "?");
  return `${n(prism)}-${n(scaffold)}-${n(brace)}`;
}

// Brace stat bonuses — sourced from Warframe wiki (not in WFCD data export).
// https://wiki.warframe.com/w/Amp
const BRACE_BONUSES = {
  "Clapkra Brace":  ["+40 Amp Energy"],
  "Juttni Brace":   ["-1s Recharge Delay"],
  "Lohrin Brace":   ["+12% Crit Chance", "+12% Status Chance"],
  "Anspatha Brace": ["+20 Amp Energy", "+15/s Recharge Rate"],
  "Suo Brace":      ["+100 Amp Energy", "+2s Recharge Delay"],
  "Plaga Brace":    ["-20 Amp Energy", "-1.5s Recharge Delay"],
  "Certus Brace":   ["+20% Crit Chance"],
  "Mote Brace":     ["Starter kit"],
};

function mergeMaterials(parts) {
  const map = new Map();
  for (const part of parts) {
    if (!part?.components) continue;
    for (const comp of part.components) {
      const key = comp.uniqueName || comp.name;
      if (!key) continue;
      const prev = map.get(key) || { name: comp.name, itemCount: 0 };
      map.set(key, {
        ...comp,
        name: comp.name,
        itemCount: (prev.itemCount || 0) + (comp.itemCount || 1),
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export default function AmpBuilderTab({ ampsData }) {
  const { t } = useTranslate();
  const addTrackedSet = useAmpStore((s) => s.addTrackedSet);
  const trackedSets = useAmpStore((s) => s.trackedSets);

  const [prismUn, setPrismUn] = useState(null);
  const [scaffoldUn, setScaffoldUn] = useState(null);
  const [braceUn, setBraceUn] = useState(null);

  const allPrisms = useMemo(
    () => [...(ampsData?.mote?.prism ? [ampsData.mote.prism] : []), ...(ampsData?.prisms || [])],
    [ampsData],
  );
  const allScaffolds = useMemo(
    () => [...(ampsData?.mote?.scaffold ? [ampsData.mote.scaffold] : []), ...(ampsData?.scaffolds || [])],
    [ampsData],
  );
  const allBraces = useMemo(
    () => [...(ampsData?.mote?.brace ? [ampsData.mote.brace] : []), ...(ampsData?.braces || [])],
    [ampsData],
  );

  const prism = allPrisms.find((p) => p.uniqueName === prismUn);
  const scaffold = allScaffolds.find((p) => p.uniqueName === scaffoldUn);
  const brace = allBraces.find((p) => p.uniqueName === braceUn);

  const selected = [prism, scaffold, brace].filter(Boolean);
  const code = buildCode(prism, scaffold, brace);
  const materials = useMemo(() => mergeMaterials(selected), [selected]);

  // Fetch material images via resolve-metadata endpoint
  const materialUns = useMemo(
    () => materials.map((m) => m.uniqueName).filter(Boolean),
    [materials],
  );
  const { data: materialMeta } = useQuery({
    queryKey: ["material-metadata", materialUns.slice().sort().join("|")],
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

  const totalBuildPrice = selected.reduce((sum, p) => sum + (p.buildPrice || 0), 0);
  // Only Prism + Scaffold have weapon stats; Brace provides passive bonuses
  const firingParts = [prism, scaffold].filter(Boolean);
  const totalDamage = firingParts.reduce((sum, p) => sum + (p.damagePerShot || 0), 0);
  const avgCrit =
    firingParts.length > 0
      ? firingParts.reduce((sum, p) => sum + (p.criticalChance || 0), 0) / firingParts.length
      : 0;
  const avgFireRate =
    firingParts.length > 0
      ? firingParts.reduce((sum, p) => sum + (p.fireRate || 0), 0) / firingParts.length
      : 0;

  const renderOption = (part) => ({
    value: part.uniqueName,
    label: (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <img
          src={part.imageUrl || FALLBACK_ICON}
          alt=""
          style={{ width: 24, height: 24, objectFit: "contain" }}
          onError={(e) => { e.target.src = FALLBACK_ICON; }}
        />
        <span style={{ fontWeight: 600 }}>{part.number === 0 ? "M" : part.number}</span>
        <span>{part.name}</span>
      </div>
    ),
  });

  const alreadyTracked = useMemo(
    () => trackedSets.some((s) => s.code === code),
    [trackedSets, code],
  );

  function trackThisSet() {
    if (!prism || !scaffold || !brace) {
      toast.error(t("ampBuilderIncomplete"));
      return;
    }
    if (alreadyTracked) {
      toast.error(t("ampBuilderAlreadyTracked", { code }));
      return;
    }
    addTrackedSet({
      code,
      prism: { uniqueName: prism.uniqueName, name: prism.name, number: prism.number },
      scaffold: { uniqueName: scaffold.uniqueName, name: scaffold.name, number: scaffold.number },
      brace: { uniqueName: brace.uniqueName, name: brace.name, number: brace.number },
    });
    toast.success(t("ampBuilderTracked", { code }));
  }

  return (
    <div className="amp-builder">
      <div className="amp-builder-grid">
        <div className="amp-builder-col">
          <label className="amp-builder-label">{t("ampPrism")}</label>
          <Select
            value={prismUn}
            onChange={setPrismUn}
            placeholder={t("ampSelectPrism")}
            options={allPrisms.map(renderOption)}
            style={{ width: "100%" }}
            allowClear
          />
          {prism && (
            <div className="amp-part-preview">
              <img src={prism.imageUrl || FALLBACK_ICON} alt="" onError={(e) => { e.target.src = FALLBACK_ICON; }} />
              <div className="amp-part-preview-stats">
                <div><span>{t("ampStatDamage")}:</span> <b>{prism.damagePerShot || 0}</b></div>
                <div><span>{t("ampStatCrit")}:</span> <b>%{Math.round((prism.criticalChance || 0) * 100)}</b></div>
                <div><span>{t("ampStatFireRate")}:</span> <b>{(prism.fireRate || 0).toFixed(1)}</b></div>
              </div>
            </div>
          )}
        </div>

        <div className="amp-builder-col">
          <label className="amp-builder-label">{t("ampScaffold")}</label>
          <Select
            value={scaffoldUn}
            onChange={setScaffoldUn}
            placeholder={t("ampSelectScaffold")}
            options={allScaffolds.map(renderOption)}
            style={{ width: "100%" }}
            allowClear
          />
          {scaffold && (
            <div className="amp-part-preview">
              <img src={scaffold.imageUrl || FALLBACK_ICON} alt="" onError={(e) => { e.target.src = FALLBACK_ICON; }} />
              <div className="amp-part-preview-stats">
                <div><span>{t("ampStatDamage")}:</span> <b>{scaffold.damagePerShot || 0}</b></div>
                <div><span>{t("ampStatCrit")}:</span> <b>%{Math.round((scaffold.criticalChance || 0) * 100)}</b></div>
                <div><span>{t("ampStatFireRate")}:</span> <b>{(scaffold.fireRate || 0).toFixed(1)}</b></div>
              </div>
            </div>
          )}
        </div>

        <div className="amp-builder-col">
          <label className="amp-builder-label">{t("ampBrace")}</label>
          <Select
            value={braceUn}
            onChange={setBraceUn}
            placeholder={t("ampSelectBrace")}
            options={allBraces.map(renderOption)}
            style={{ width: "100%" }}
            allowClear
          />
          {brace && (
            <div className="amp-part-preview">
              <img src={brace.imageUrl || FALLBACK_ICON} alt="" onError={(e) => { e.target.src = FALLBACK_ICON; }} />
              <div className="amp-part-preview-stats amp-brace-bonuses">
                <div className="amp-brace-bonuses-label">{t("ampBraceBonus")}</div>
                {(BRACE_BONUSES[brace.name] || [t("ampBraceNoData")]).map((bonus) => (
                  <div key={bonus} className="amp-brace-bonus-line">{bonus}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Combination code + summary */}
      {selected.length > 0 && (
        <div className="amp-builder-summary">
          <div className="amp-builder-code-wrap">
            <div className="amp-builder-code-label">{t("ampCode")}</div>
            <div className="amp-builder-code">{code}</div>
          </div>
          <div className="amp-builder-stats">
            <div className="amp-builder-stat">
              <span>{t("ampStatTotalDamage")}</span>
              <b>{totalDamage.toFixed(0)}</b>
            </div>
            <div className="amp-builder-stat">
              <span>{t("ampStatAvgCrit")}</span>
              <b>%{Math.round(avgCrit * 100)}</b>
            </div>
            <div className="amp-builder-stat">
              <span>{t("ampStatAvgFireRate")}</span>
              <b>{avgFireRate.toFixed(1)}</b>
            </div>
            <div className="amp-builder-stat">
              <span>{t("ampStatBuildCost")}</span>
              <b>{totalBuildPrice.toLocaleString()}</b>
            </div>
          </div>
          <div className="amp-builder-actions">
            <Tooltip title={alreadyTracked ? t("ampBuilderAlreadyTrackedTip") : t("ampBuilderTrackTip")}>
              <Button
                type="primary"
                icon={<AimOutlined />}
                onClick={trackThisSet}
                disabled={selected.length < 3 || alreadyTracked}
              >
                {alreadyTracked ? t("ampBuilderAlreadyTrackedBtn") : t("ampBuilderTrack")}
              </Button>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Materials list */}
      {materials.length > 0 && (
        <div className="amp-builder-materials">
          <div className="amp-builder-materials-title">{t("ampBuilderMaterials")}</div>
          <div className="amp-builder-materials-grid">
            {materials.map((m) => {
              const meta = metaByUn[m.uniqueName];
              const img = meta?.imageUrl || FALLBACK_ICON;
              return (
                <div key={m.uniqueName || m.name} className="amp-material-item">
                  <img
                    src={img}
                    alt=""
                    className="amp-material-img"
                    onError={(e) => { e.target.src = FALLBACK_ICON; }}
                  />
                  <span className="amp-material-name">{m.name}</span>
                  <span className="amp-material-qty">×{m.itemCount}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
