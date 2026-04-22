import { useState, useMemo } from "react";
import { Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import RelicCardGrid from "./RelicCardGrid";
import { useTranslate } from "../../hooks/useTranslate";
import { useRelicStore } from "../../stores/relicStore";

const { Text } = Typography;

export default function RelicTrackerContent({ watchedPrimes, onToggleFound }) {
  const { t } = useTranslate();
  const foundComponents = useRelicStore((s) => s.foundComponents);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [filter, setFilter] = useState("all");

  const categoryOptions = useMemo(() => {
    const cats = new Set();
    for (const item of watchedPrimes) {
      const cat = item.category || item.type || "";
      if (cat) cats.add(cat);
    }
    return ["all", ...Array.from(cats).sort()];
  }, [watchedPrimes]);

  const filteredPrimes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return watchedPrimes.filter((item) => {
      if (query && !item.name.toLowerCase().includes(query)) return false;
      if (category !== "all") {
        const cat = (item.category || item.type || "").toLowerCase();
        if (cat !== category.toLowerCase()) return false;
      }
      if (filter === "all") return true;
      const found = foundComponents[item.uniqueName] || {};
      const foundCount = Object.values(found).filter(Boolean).length;
      const totalCount = Object.keys(found).length;
      const allDone = totalCount > 0 && foundCount === totalCount;
      if (filter === "done") return allDone;
      if (filter === "open") return !allDone;
      return true;
    });
  }, [watchedPrimes, search, category, filter, foundComponents]);

  return (
    <>
      <div className="content-header">
        <div className="content-tabs">
          <span className="content-tab active" style={{ cursor: "default" }}>
            {t("watchedPrimes")} <span className="content-tab-badge">{watchedPrimes.length}</span>
          </span>
        </div>
        <div className="content-actions">
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t("relicAutoSyncHint")}
          </Text>
        </div>
      </div>

      <div className="craft-toolbar">
        <div className="craft-toolbar-left">
          <div className="craft-search-compact">
            <SearchOutlined className="craft-search-compact-icon" />
            <input
              className="craft-search-compact-input"
              placeholder={t("search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="craft-search-clear" onClick={() => setSearch("")}>&times;</button>
            )}
          </div>
          {categoryOptions.length > 1 && (
            <>
              <div className="craft-toolbar-divider" />
              <div className="craft-category-pills">
                {categoryOptions.map((c) => (
                  <button
                    key={c}
                    className={`craft-category-pill ${category === c ? "active" : ""}`}
                    onClick={() => setCategory(c)}
                  >
                    {c === "all" ? t("allCategories") : c}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="craft-filter-group">
          {["all", "open", "done"].map((f) => (
            <button
              key={f}
              className={`craft-filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {t(f === "all" ? "completionAll" : f === "open" ? "completionOpen" : "completionDone")}
            </button>
          ))}
        </div>
      </div>

      <RelicCardGrid
        watchedPrimes={filteredPrimes}
        foundComponents={foundComponents}
        onToggleFound={onToggleFound}
        onRemovePrime={() => {}}
      />
    </>
  );
}
