import { Button, Tag } from "antd";
import { AimOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";
import { FALLBACK_ICON, handleImgError } from "../../../utils/helpers";
import { useTranslate } from "../../../hooks/useTranslate";
import { useAmpStore } from "../../../stores/ampStore";

// Community meta loadouts — hardcoded from Warframe community wisdom
// Code format: Prism-Scaffold-Brace (numbered)
// Source: common Eidolon/general-purpose picks across wiki & reddit meta.
const META_PRESETS = [
  {
    code: "2-7-7",
    tagKey: "metaTagEidolon",
    nameKey: "metaShwaakPropaCertus",
    descKey: "metaShwaakPropaCertusDesc",
    prism: "Shwaak Prism",
    scaffold: "Propa Scaffold",
    brace: "Certus Brace",
  },
  {
    code: "1-7-7",
    tagKey: "metaTagEidolon",
    nameKey: "metaRaplakPropaCertus",
    descKey: "metaRaplakPropaCertusDesc",
    prism: "Raplak Prism",
    scaffold: "Propa Scaffold",
    brace: "Certus Brace",
  },
  {
    code: "7-7-7",
    tagKey: "metaTagAllRounder",
    nameKey: "metaKlamoraPropaCertus",
    descKey: "metaKlamoraPropaCertusDesc",
    prism: "Klamora Prism",
    scaffold: "Propa Scaffold",
    brace: "Certus Brace",
  },
  {
    code: "4-7-7",
    tagKey: "metaTagEidolon",
    nameKey: "metaRahnPropaCertus",
    descKey: "metaRahnPropaCertusDesc",
    prism: "Rahn Prism",
    scaffold: "Propa Scaffold",
    brace: "Certus Brace",
  },
  {
    code: "1-2-3",
    tagKey: "metaTagStarter",
    nameKey: "metaStarter",
    descKey: "metaStarterDesc",
    prism: "Raplak Prism",
    scaffold: "Shraksun Scaffold",
    brace: "Lohrin Brace",
  },
  {
    code: "3-2-3",
    tagKey: "metaTagCrowd",
    nameKey: "metaGranmuShraksun",
    descKey: "metaGranmuShraksunDesc",
    prism: "Granmu Prism",
    scaffold: "Shraksun Scaffold",
    brace: "Lohrin Brace",
  },
];

function findPart(ampsData, name, slot) {
  if (!ampsData) return null;
  const pool =
    slot === "prism" ? ampsData.prisms :
    slot === "scaffold" ? ampsData.scaffolds :
    slot === "brace" ? ampsData.braces : [];
  return pool.find((p) => p.name === name) || null;
}

function PresetCard({ preset, ampsData, t, onTrack, alreadyTracked }) {
  const prism = findPart(ampsData, preset.prism, "prism");
  const scaffold = findPart(ampsData, preset.scaffold, "scaffold");
  const brace = findPart(ampsData, preset.brace, "brace");

  return (
    <div className="amp-preset-card">
      <div className="amp-preset-header">
        <div className="amp-preset-code">{preset.code}</div>
        <Tag color="gold" className="amp-preset-tag">{t(preset.tagKey)}</Tag>
      </div>
      <div className="amp-preset-name">{t(preset.nameKey)}</div>
      <div className="amp-preset-desc">{t(preset.descKey)}</div>

      <div className="amp-preset-parts">
        {[prism, scaffold, brace].filter(Boolean).map((p) => (
          <div key={p.uniqueName} className="amp-preset-part">
            <img
              src={p.imageUrl || FALLBACK_ICON}
              alt=""
              onError={handleImgError}
            />
            <div>
              <div className="amp-preset-part-name">{p.name}</div>
              <div className="amp-preset-part-slot">{p.slot}</div>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="primary"
        block
        icon={<AimOutlined />}
        onClick={() => onTrack(preset, prism, scaffold, brace)}
        disabled={!prism || !scaffold || !brace || alreadyTracked}
      >
        {alreadyTracked ? t("metaAlreadyTracked") : t("metaTrackSet")}
      </Button>
    </div>
  );
}

export default function AmpMetaTab({ ampsData }) {
  const { t } = useTranslate();
  const trackedSets = useAmpStore((s) => s.trackedSets);
  const addTrackedSet = useAmpStore((s) => s.addTrackedSet);
  const trackedCodes = new Set(trackedSets.map((s) => s.code));

  function trackPreset(preset, prism, scaffold, brace) {
    if (!prism || !scaffold || !brace) return;
    if (trackedCodes.has(preset.code)) {
      toast.error(t("ampBuilderAlreadyTracked", { code: preset.code }));
      return;
    }
    addTrackedSet({
      code: preset.code,
      prism: { uniqueName: prism.uniqueName, name: prism.name, number: prism.number },
      scaffold: { uniqueName: scaffold.uniqueName, name: scaffold.name, number: scaffold.number },
      brace: { uniqueName: brace.uniqueName, name: brace.name, number: brace.number },
    });
    toast.success(t("ampBuilderTracked", { code: preset.code }));
  }

  return (
    <div className="amp-meta">
      <div className="amp-meta-section">
        <h3 className="amp-section-title">{t("metaCommunityTitle")}</h3>
        <p className="amp-meta-hint">{t("metaCommunityHint")}</p>
        <div className="amp-preset-grid">
          {META_PRESETS.map((preset) => (
            <PresetCard
              key={preset.code + preset.nameKey}
              preset={preset}
              ampsData={ampsData}
              t={t}
              onTrack={trackPreset}
              alreadyTracked={trackedCodes.has(preset.code)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
