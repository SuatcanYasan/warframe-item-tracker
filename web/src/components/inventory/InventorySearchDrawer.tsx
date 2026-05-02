import { useState, useEffect } from "react";
import {
  Button, Drawer, Empty, InputNumber, List, Spin, Typography,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { FALLBACK_ICON, handleImgError } from "../../utils/helpers";
import { useSearchComponents } from "../../hooks/useApiQueries";
import { useTranslate } from "../../hooks/useTranslate";
import type { InventoryPart } from "../../types";

const { Text } = Typography;

interface ComponentItem {
  uniqueName: string;
  name: string;
  parentUniqueName: string;
  parentName: string;
  parentImageUrl: string | null;
  parentCategory?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onAddPart: (comp: ComponentItem, quantity: number) => void;
  existingParts: Record<string, InventoryPart>;
}

export default function InventorySearchDrawer({ open, onClose, onAddPart, existingParts }: Props) {
  const { t } = useTranslate();
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open) { setSearch(""); setDebouncedSearch(""); setQuantities({}); }
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading: loading } = useSearchComponents(debouncedSearch);
  const results: ComponentItem[] = (data as any)?.components || [];
  const [parent] = useAutoAnimate<HTMLDivElement>();

  function handleSearch(value: string) {
    setSearch(value);
    if (!value.trim()) return;
  }

  return (
    <Drawer
      title={t("addPart")}
      placement="right"
      width={420}
      open={open}
      onClose={onClose}
    >
      <div className="craft-search-compact" style={{ marginBottom: 16 }}>
        <SearchOutlined className="craft-search-compact-icon" />
        <input
          className="craft-search-compact-input"
          placeholder={t("partSearch")}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          autoFocus
        />
        {search && (
          <button className="craft-search-clear" onClick={() => handleSearch("")}>&times;</button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 32 }}><Spin /></div>
      ) : results.length === 0 && search.trim() ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("noResults")} />
      ) : (
        <div ref={parent}>
        <List
          size="small"
          dataSource={results}
          renderItem={(comp: ComponentItem) => {
            const exists = !!existingParts[comp.uniqueName];
            const qty = quantities[comp.uniqueName] ?? 1;
            return (
              <List.Item
                style={{ padding: "8px 0", borderBottom: "1px solid var(--wf-border)" }}
                actions={[
                  <InputNumber
                    key="qty"
                    min={1}
                    max={99}
                    value={qty}
                    size="small"
                    style={{ width: 60 }}
                    onChange={(v) => setQuantities((prev) => ({ ...prev, [comp.uniqueName]: v || 1 }))}
                  />,
                  <Button
                    key="add"
                    size="small"
                    type={exists ? "default" : "primary"}
                    disabled={exists}
                    onClick={() => {
                      onAddPart(comp, qty);
                    }}
                  >
                    {exists ? "+" : t("add")}
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <img
                      src={comp.parentImageUrl || FALLBACK_ICON}
                      alt=""
                      style={{ width: 32, height: 32, objectFit: "contain" }}
                      onError={handleImgError} loading="lazy" decoding="async" />
                  }
                  title={<Text style={{ fontSize: 13 }}>{comp.name}</Text>}
                  description={
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {comp.parentName} • {comp.parentCategory || ""}
                    </Text>
                  }
                />
              </List.Item>
            );
          }}
        />
        </div>
      )}
    </Drawer>
  );
}
