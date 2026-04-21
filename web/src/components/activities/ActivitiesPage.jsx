import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "antd";
import { CompassOutlined } from "@ant-design/icons";
import { requestJson } from "../../utils/helpers";
import { useTranslate } from "../../hooks/useTranslate";
import FissuresTab from "./tabs/FissuresTab";
import InvasionsTab from "./tabs/InvasionsTab";
import NightwaveTab from "./tabs/NightwaveTab";
import SortieArchonTab from "./tabs/SortieArchonTab";
import ArbitrationTab from "./tabs/ArbitrationTab";

const TABS = [
  { key: "fissures", labelKey: "actFissuresTab" },
  { key: "invasions", labelKey: "actInvasionsTab" },
  { key: "nightwave", labelKey: "actNightwaveTab" },
  { key: "sortie", labelKey: "actSortieTab" },
  { key: "arbitration", labelKey: "actArbitrationTab" },
];

export default function ActivitiesPage() {
  const { t } = useTranslate();
  const [activeTab, setActiveTab] = useState("fissures");

  const { data, isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: () => requestJson("/api/activities"),
    refetchInterval: 60_000,    // refetch every minute
    staleTime: 30_000,
  });

  return (
    <div className="activities-page">
      <div className="activities-header">
        <div className="activities-header-icon-wrap">
          <CompassOutlined className="activities-header-icon" />
        </div>
        <div>
          <h1 className="activities-title">{t("activitiesTitle")}</h1>
          <p className="activities-subtitle">{t("activitiesSubtitle")}</p>
        </div>
      </div>

      <div className="activities-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`activities-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <div className="activities-body">
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : (
          <>
            {activeTab === "fissures" && <FissuresTab fissures={data?.fissures || []} />}
            {activeTab === "invasions" && <InvasionsTab invasions={data?.invasions || []} />}
            {activeTab === "nightwave" && <NightwaveTab nightwave={data?.nightwave} />}
            {activeTab === "sortie" && <SortieArchonTab sortie={data?.sortie} archonHunt={data?.archonHunt} />}
            {activeTab === "arbitration" && <ArbitrationTab arbitration={data?.arbitration} />}
          </>
        )}
      </div>
    </div>
  );
}
