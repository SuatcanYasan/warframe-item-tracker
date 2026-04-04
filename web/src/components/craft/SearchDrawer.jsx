import { useRef, useState, useEffect } from "react";
import { Button, Drawer, Input, List, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { FALLBACK_ICON } from "../../utils/helpers";
import { useSearchItemsInitial } from "../../hooks/useApiQueries";
import EmptyState from "../shared/EmptyState";
import { useTranslate } from "../../hooks/useTranslate";

export default function SearchDrawer({ open, onClose, onAddItem }) {
  const { t, tin } = useTranslate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && !hasInitialLoad) {
      setHasInitialLoad(true);
    }
  }, [open, hasInitialLoad]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading: loading } = useSearchItemsInitial(debouncedSearch, hasInitialLoad);
  const results = data?.items || [];
  const [parent] = useAutoAnimate();

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

      <div ref={parent} style={{ flex: 1, overflowY: "auto" }}>
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
