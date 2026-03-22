import { useRef, useState, useEffect, useCallback } from "react";
import { Button, Card, Flex, Input, List, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { FALLBACK_ICON, requestJson } from "../utils/helpers";
import EmptyState from "./EmptyState";
import DropInfoPopover from "./DropInfoPopover";

export default function SearchPanel({ t, tin, onAddItem, searchInputRef }) {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const debounceRef = useRef(null);

  const runSearch = useCallback(async (query) => {
    const normalized = query.trim();
    setLoadingSearch(true);
    try {
      const url = normalized
        ? `/api/items?search=${encodeURIComponent(normalized)}&limit=40`
        : `/api/items?limit=40`;
      const data = await requestJson(url);
      setSearchResults(data.items || []);
    } catch {
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  }, []);

  useEffect(() => {
    if (!hasInitialLoad) {
      setHasInitialLoad(true);
      runSearch("");
    }
  }, [hasInitialLoad, runSearch]);

  useEffect(() => {
    if (!hasInitialLoad) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, runSearch, hasInitialLoad]);

  return (
    <Card
      title={`${t("items")} - ${t("resultCount", { count: searchResults.length })}`}
      className="panel-card"
    >
      <Flex vertical gap={8} className="panel-content">
        <Input
          ref={searchInputRef}
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={() => runSearch(search)}
          suffix={<SearchOutlined />}
          allowClear
        />

        <div className="panel-scroll">
          <Spin spinning={loadingSearch}>
            <List
              className="panel-list"
              dataSource={searchResults}
              locale={{ emptyText: <EmptyState type="search" description={t("noResults")} /> }}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <DropInfoPopover key="info" uniqueName={item.uniqueName} itemName={item.name} t={t} />,
                    <Button key="add" type="primary" size="small" onClick={() => onAddItem(item)}>
                      {t("add")}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <img src={item.imageUrl || FALLBACK_ICON} alt={item.name} className="item-thumb" />
                    }
                    title={tin(item.uniqueName, item.name)}
                    description={item.type || t("unknown")}
                  />
                </List.Item>
              )}
            />
          </Spin>
        </div>
      </Flex>
    </Card>
  );
}
