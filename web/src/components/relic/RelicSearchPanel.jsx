import { useRef, useState, useEffect, useCallback } from "react";
import { Button, Flex, Input, List, Spin, Tag } from "antd";
import { SearchOutlined, CheckOutlined } from "@ant-design/icons";
import { FALLBACK_ICON, requestJson } from "../../utils/helpers";
import EmptyState from "../shared/EmptyState";

export default function RelicSearchPanel({ t, watchedPrimes, onWatchPrime }) {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const debounceRef = useRef(null);

  const watchedSet = new Set(watchedPrimes.map((p) => p.uniqueName));

  const runSearch = useCallback(async (query) => {
    const normalized = query.trim();
    setLoadingSearch(true);
    try {
      const url = normalized
        ? `/api/items?search=${encodeURIComponent(normalized)}&limit=40&primeOnly=true`
        : `/api/items?limit=40&primeOnly=true`;
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
    <Flex vertical gap={8}>
        <Input
          placeholder={t("primeSearchPlaceholder")}
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
              renderItem={(item) => {
                const isWatched = watchedSet.has(item.uniqueName);
                return (
                  <List.Item
                    actions={[
                      isWatched ? (
                        <Tag key="watched" color="success" icon={<CheckOutlined />}>
                          {t("componentFound")}
                        </Tag>
                      ) : (
                        <Button key="watch" type="primary" size="small" onClick={() => onWatchPrime(item)}>
                          {t("watchPrime")}
                        </Button>
                      ),
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <img src={item.imageUrl || FALLBACK_ICON} alt={item.name} className="item-thumb" />
                      }
                      title={item.name}
                      description={item.type || item.category || t("unknown")}
                    />
                  </List.Item>
                );
              }}
            />
          </Spin>
        </div>
      </Flex>
  );
}
