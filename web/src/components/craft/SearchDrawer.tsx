import { useRef, useState, useEffect } from "react";
import { Button, Drawer, Input, List, Spin } from "antd";
import type { InputRef } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { FALLBACK_ICON, handleImgError } from "../../utils/helpers";
import { useSearchItemsInitial } from "../../hooks/useApiQueries";
import EmptyState from "../shared/EmptyState";
import { useTranslate } from "../../hooks/useTranslate";

interface SearchItem {
  uniqueName: string;
  name: string;
  imageUrl?: string | null;
  type?: string | null;
  category?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onAddItem: (item: SearchItem) => void;
}

export default function SearchDrawer({ open, onClose, onAddItem }: Props) {
  const { t } = useTranslate();
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [hasInitialLoad, setHasInitialLoad] = useState<boolean>(false);
  const inputRef = useRef<InputRef | null>(null);

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
  const results: SearchItem[] = (data as any)?.items || [];
  const [parent] = useAutoAnimate<HTMLDivElement>();

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
        prefix={<SearchOutlined />}
        allowClear
        size="large"
      />

      <div ref={parent} style={{ flex: 1, overflowY: "auto" }}>
        <Spin spinning={loading}>
          <List
            dataSource={results}
            locale={{ emptyText: <EmptyState icon="search" description={t("noResults")} /> }}
            renderItem={(item: SearchItem) => (
              <div className="search-drawer-item">
                <img
                  src={item.imageUrl || FALLBACK_ICON}
                  alt={item.name}
                  className="search-drawer-img"
                  onError={handleImgError} loading="lazy" decoding="async" />
                <div className="search-drawer-info">
                  <div className="search-drawer-name">{item.name}</div>
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
