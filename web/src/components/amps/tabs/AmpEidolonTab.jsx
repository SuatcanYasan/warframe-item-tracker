import { useMemo, useState } from "react";
import { Select, Alert } from "antd";
import { FALLBACK_ICON } from "../../../utils/helpers";
import { useTranslate } from "../../../hooks/useTranslate";

const WF_ICONS = "https://wiki.warframe.com/images";

// Community-accepted starting shield values (wiki, PC)
const EIDOLONS = [
  { key: "teralyst", labelKey: "eidolonTeralyst", shield: 50000, img: `${WF_ICONS}/EidolonTeralyst.png` },
  { key: "gantulyst", labelKey: "eidolonGantulyst", shield: 60000, img: `${WF_ICONS}/EidolonGantulyst.png` },
  { key: "hydrolyst", labelKey: "eidolonHydrolyst", shield: 70000, img: `${WF_ICONS}/EidolonHydrolyst.png` },
];

function calcShieldTime(amp, shieldHP) {
  if (!amp) return null;
  const dmg = amp.damagePerShot || amp.totalDamage || 0;
  const fire = amp.fireRate || 1;
  const crit = amp.criticalChance || 0;
  const critMult = amp.criticalMultiplier || 2;
  const avgDamage = dmg * (1 + crit * (critMult - 1));
  const dps = avgDamage * fire;
  if (dps <= 0) return null;
  const seconds = shieldHP / dps;
  return { seconds, dps };
}

export default function AmpEidolonTab({ ampsData }) {
  const { t } = useTranslate();
  const [prismUn, setPrismUn] = useState(null);

  const allPrisms = useMemo(
    () => [
      ...(ampsData?.mote?.prism ? [ampsData.mote.prism] : []),
      ...(ampsData?.prisms || []),
    ],
    [ampsData],
  );

  const prism = allPrisms.find((p) => p.uniqueName === prismUn);

  return (
    <div className="amp-eidolon">
      <Alert
        type="info"
        showIcon
        message={t("eidolonDisclaimerTitle")}
        description={t("eidolonDisclaimerBody")}
        style={{ marginBottom: 16 }}
      />

      <div className="amp-eidolon-picker">
        <label className="amp-builder-label">{t("eidolonPickAmpPrism")}</label>
        <Select
          value={prismUn}
          onChange={setPrismUn}
          placeholder={t("ampSelectPrism")}
          style={{ width: "100%", maxWidth: 420 }}
          allowClear
          options={allPrisms.map((p) => ({
            value: p.uniqueName,
            label: `${p.number === 0 ? "M" : p.number} — ${p.name}`,
          }))}
        />
      </div>

      <div className="amp-eidolon-grid">
        {EIDOLONS.map((e) => {
          const result = calcShieldTime(prism, e.shield);
          return (
            <div key={e.key} className="amp-eidolon-card">
              <img
                src={e.img}
                alt=""
                className="amp-eidolon-img"
                onError={(ev) => { ev.target.src = FALLBACK_ICON; }}
              />
              <div className="amp-eidolon-name">{t(e.labelKey)}</div>
              <div className="amp-eidolon-shield">
                <span>{t("eidolonShield")}</span>
                <b>{e.shield.toLocaleString()}</b>
              </div>
              {result ? (
                <>
                  <div className="amp-eidolon-dps">
                    <span>{t("eidolonAvgDps")}</span>
                    <b>{result.dps.toFixed(0)}</b>
                  </div>
                  <div className="amp-eidolon-time">
                    <span>{t("eidolonShieldBreakTime")}</span>
                    <b>{result.seconds.toFixed(1)}s</b>
                  </div>
                </>
              ) : (
                <div className="amp-eidolon-placeholder">{t("eidolonSelectFirst")}</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="amp-eidolon-checklist">
        <div className="amp-eidolon-checklist-title">{t("eidolonChecklistTitle")}</div>
        <ul>
          <li>{t("eidolonChecklist1")}</li>
          <li>{t("eidolonChecklist2")}</li>
          <li>{t("eidolonChecklist3")}</li>
          <li>{t("eidolonChecklist4")}</li>
          <li>{t("eidolonChecklist5")}</li>
        </ul>
      </div>
    </div>
  );
}
