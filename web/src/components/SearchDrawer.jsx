import { useRef, useState, useEffect, useCallback } from "react";
import { Button, Drawer, Input, List, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { FALLBACK_ICON, requestJson } from "../utils/helpers";
import EmptyState from "./EmptyState";

export default function SearchDrawer({ t, tin, open, onClose, onAddItem }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const runSearch = useCallback(async (query) => {
    const normalized = query.trim();
    setLoading(true);
    try {
      const url = normalized
        ? `/api/items?search=${encodeURIComponent(normalized)}&limit=40`
        : `/api/items?limit=40`;
      const data = await requestJson(url);
      setResults(data.items || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && !hasInitialLoad) {
      setHasInitialLoad(true);
      runSearch("");
    }
  }, [open, hasInitialLoad, runSearch]);

  useEffect(() => {
    if (!hasInitialLoad) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, runSearch, hasInitialLoad]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  return (
    <Drawer
      title={t("addItem")}
      placement="right"
      width={420}
      open={open}
      onClose={onClose}
      className="search-drawer"
      styles={{ body: { padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 } }}
    >
      <Input
        ref={inputRef}
        placeholder={t("searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onPressEnter={() => runSearch(search)}
        prefix={<SearchOutlined />}
        allowClear
        size="large"
      />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <Spin spinning={loading}>
          <List
            dataSource={results}
            locale={{ emptyText: <EmptyState type="search" description={t("noResults")} /> }}
            renderItem={(item) => (
              <div className="search-drawer-item">
                <img
                  src={item.imageUrl || FALLBACK_ICON}
                  alt={item.name}
                  className="search-drawer-img"
                  onError={(e) => { e.target.src = FALLBACK_ICON; }}
                />
                <div className="search-drawer-info">
                  <div className="search-drawer-name">{tin(item.uniqueName, item.name)}</div>
                  <div className="search-drawer-type">{item.type || item.category || t("unknown")}</div>
                </div>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => onAddItem(item)}
                >
                  {t("addItem")}
                </Button>
              </div>
            )}
          />
        </Spin>
      </div>
    </Drawer>
  );
}
