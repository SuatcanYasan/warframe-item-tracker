import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "antd";
import { requestJson } from "../../utils/helpers";
import { useTranslate } from "../../hooks/useTranslate";

const WF_ICONS = "https://wiki.warframe.com/images";
import AmpBuilderTab from "./tabs/AmpBuilderTab";
import AmpTrackerTab from "./tabs/AmpTrackerTab";
import AmpEidolonTab from "./tabs/AmpEidolonTab";
import AmpMetaTab from "./tabs/AmpMetaTab";
import AmpMasteryTab from "./tabs/AmpMasteryTab";

const TABS = [
  { key: "builder", labelKey: "ampTabBuilder" },
  { key: "tracker", labelKey: "ampTabTracker" },
  { key: "mastery", labelKey: "ampTabMastery" },
  { key: "eidolon", labelKey: "ampTabEidolon" },
  { key: "meta", labelKey: "ampTabMeta" },
];

export default function AmpsPage() {
  const { t } = useTranslate();
  const [activeTab, setActiveTab] = useState("builder");

  const { data: ampsData, isLoading } = useQuery({
    queryKey: ["amps"],
    queryFn: () => requestJson("/api/amps"),
    staleTime: 30 * 60 * 1000,
  });

  const allParts = useMemo(() => {
    if (!ampsData) return [];
    return [
      ...ampsData.prisms,
      ...ampsData.scaffolds,
      ...ampsData.braces,
      ...(ampsData.mote?.prism ? [ampsData.mote.prism] : []),
      ...(ampsData.mote?.scaffold ? [ampsData.mote.scaffold] : []),
      ...(ampsData.mote?.brace ? [ampsData.mote.brace] : []),
    ];
  }, [ampsData]);

  if (isLoading) {
    return (
      <div className="amps-page">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  return (
    <div className="amps-page">
      <div className="amps-header">
        <div className="amps-header-icon-wrap">
          <img src={`${WF_ICONS}/IconCategoryAmp%28xWhite%29.png`} alt="" className="amps-header-icon" />
        </div>
        <div>
          <h1 className="amps-title">{t("ampsTrackerTitle")}</h1>
          <p className="amps-subtitle">{t("ampsTrackerSubtitle")}</p>
        </div>
      </div>

      <div className="amps-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`amps-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <div className="amps-tab-body">
        {activeTab === "builder" && <AmpBuilderTab ampsData={ampsData} />}
        {activeTab === "tracker" && <AmpTrackerTab allParts={allParts} />}
        {activeTab === "mastery" && <AmpMasteryTab allParts={allParts} />}
        {activeTab === "eidolon" && <AmpEidolonTab ampsData={ampsData} />}
        {activeTab === "meta" && <AmpMetaTab ampsData={ampsData} />}
      </div>
    </div>
  );
}
