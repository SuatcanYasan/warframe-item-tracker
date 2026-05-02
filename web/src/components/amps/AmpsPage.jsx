import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { requestJson } from "../../utils/helpers";
import { useTranslate } from "../../hooks/useTranslate";
import SkeletonGrid from "../shared/SkeletonGrid";
import ErrorState from "../shared/ErrorState";

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

  const { data: ampsData, isLoading, isError, refetch } = useQuery({
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
        <SkeletonGrid variant="card" count={9} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="amps-page">
        <ErrorState
          title={t("errorAmpsTitle")}
          description={t("errorAmpsDesc")}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="amps-page">
      <div className="amps-header">
        <div className="amps-header-icon-wrap">
          <img src={`${WF_ICONS}/IconCategoryAmp%28xWhite%29.png`} alt="" className="amps-header-icon" loading="lazy" decoding="async" />
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
        {activeTab === "tracker" && <AmpTrackerTab allParts={allParts} onGoToBuilder={() => setActiveTab("builder")} />}
        {activeTab === "mastery" && <AmpMasteryTab allParts={allParts} />}
        {activeTab === "eidolon" && <AmpEidolonTab ampsData={ampsData} />}
        {activeTab === "meta" && <AmpMetaTab ampsData={ampsData} />}
      </div>
    </div>
  );
}
