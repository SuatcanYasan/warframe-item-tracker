import { useRef, useState, useEffect, useCallback } from "react";
import { Button, Flex, Input, List, Spin, Tag } from "antd";
import { SearchOutlined, CheckOutlined } from "@ant-design/icons";
import { FALLBACK_ICON, requestJson } from "../../utils/helpers";
import EmptyState from "../shared/EmptyState";
import type { TranslateFn } from "../../hooks/useTranslate";
import type { SelectedCraftItem } from "../../types";

interface SearchResultItem {
  uniqueName: string;
  name: string;
  imageUrl?: string | null;
  type?: string | null;
  category?: string | null;
}

interface Props {
  t: TranslateFn;
  watchedPrimes: SelectedCraftItem[];
  onWatchPrime: (item: SearchResultItem) => void;
}

export default function RelicSearchPanel({ t, watchedPrimes, onWatchPrime }: Props) {
  const [search, setSearch] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [hasInitialLoad, setHasInitialLoad] = useState<boolean>(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const watchedSet = new Set(watchedPrimes.map((p) => p.uniqueName));

  const runSearch = useCallback(async (query: string) => {
    const normalized = query.trim();
    setLoadingSearch(true);
    try {
      const url = normalized
        ? `/api/items?search=${encodeURIComponent(normalized)}&limit=40&primeOnly=true`
        : `/api/items?limit=40&primeOnly=true`;
      const data = await requestJson(url) as { items?: SearchResultItem[] };
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
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
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
              locale={{ emptyText: <EmptyState icon="search" description={t("noResults")} /> }}
              renderItem={(item: SearchResultItem) => {
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
                        <img src={item.imageUrl || FALLBACK_ICON} alt={item.name} className="item-thumb" loading="lazy" decoding="async" />
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
