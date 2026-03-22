import {
  App,
  Button,
  Card,
  Collapse,
  Empty,
  Flex,
  Input,
  InputNumber,
  List,
  Progress,
  Select,
  Segmented,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { ClearOutlined, DeleteOutlined, DownloadOutlined, SearchOutlined, UploadOutlined } from "@ant-design/icons";
import { FALLBACK_ICON, makeRequirementKey, enrichRequirements } from "../utils/helpers";
import { useRef } from "react";
import EmptyState from "./EmptyState";
import DropInfoPopover from "./DropInfoPopover";

const { Text } = Typography;

export default function SelectedPanel({
  t,
  tin,
  selectedItems,
  filteredSelectedItems,
  selectedSearch,
  setSelectedSearch,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
  selectedCategoryOptions,
  completionView,
  setCompletionView,
  activeKeys,
  setActiveKeys,
  activeSelected,
  setActiveSelected,
  detailByItem,
  completedMap,
  enrichedByItem,
  focusRequirementKey,
  requirementRefs,
  focusedTotalRequirement,
  setFocusedTotalRequirement,
  focusRequirementKeyValue,
  removeItem,
  updateQuantity,
  setCompletedQuantity,
  clearAllItems,
  onImportData,
}) {
  const { modal, message } = App.useApp();
  const importInputRef = useRef(null);

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      selectedItems,
      completedMap,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wf-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    message.success(t("exportSuccess"));
  }

  function importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        if (!Array.isArray(parsed.selectedItems)) throw new Error("invalid");
        onImportData(parsed);
        message.success(t("importSuccess"));
      } catch {
        message.error(t("importError"));
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function confirmRemoveItem(item) {
    modal.confirm({
      title: t("confirmRemoveTitle"),
      content: t("confirmRemoveContent", { name: item.name }),
      okText: t("confirmRemoveOk"),
      cancelText: t("confirmRemoveCancel"),
      okButtonProps: { danger: true },
      onOk: () => removeItem(item.uniqueName),
    });
  }

  function confirmClearAll() {
    modal.confirm({
      title: t("confirmClearAllTitle"),
      content: t("confirmClearAllContent"),
      okText: t("confirmRemoveOk"),
      cancelText: t("confirmRemoveCancel"),
      okButtonProps: { danger: true },
      onOk: () => clearAllItems(),
    });
  }

  const collapseItems = filteredSelectedItems.map((item) => {
    const requirements = detailByItem.get(item.uniqueName) || [];
    const rows = enrichRequirements(requirements, completedMap[item.uniqueName] || {}, completionView);
    const isActive = activeSelected === item.uniqueName;

    return {
      key: item.uniqueName,
      label: (
        <Flex
          align="center"
          justify="space-between"
          gap={8}
          className={isActive ? "collapse-label active" : "collapse-label"}
        >
          <Space align="center">
            <img src={item.imageUrl || FALLBACK_ICON} alt={item.name} className="item-thumb" />
            <span>{tin(item.uniqueName, item.name)}</span>
          </Space>
          <Space>
            <DropInfoPopover uniqueName={item.uniqueName} itemName={item.name} t={t} />
            <InputNumber
              min={1}
              size="small"
              value={item.quantity}
              onClick={(e) => e.stopPropagation()}
              onChange={(value) => updateQuantity(item.uniqueName, value)}
            />
            <Tooltip title={t("remove")}>
              <Button
                danger
                size="small"
                type="text"
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  confirmRemoveItem(item);
                }}
              />
            </Tooltip>
          </Space>
        </Flex>
      ),
      children:
        requirements.length === 0 ? (
          <Empty description={t("noDetail")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : rows.length === 0 ? (
          <Empty description={t("noResults")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            dataSource={rows}
            className="inner-scroll"
            renderItem={(requirement) => {
              const requirementKey = makeRequirementKey(item.uniqueName, requirement.uniqueName);
              return (
                <List.Item
                  className={focusRequirementKeyValue === requirementKey ? "focus-row" : ""}
                  ref={(node) => {
                    if (node) {
                      requirementRefs.current.set(requirementKey, node);
                    } else {
                      requirementRefs.current.delete(requirementKey);
                    }
                  }}
                  actions={[
                    <Space key="right" direction="vertical" size={2} align="end">
                      <InputNumber
                        min={0}
                        max={requirement.quantity}
                        size="small"
                        value={requirement.completedQuantity}
                        onChange={(value) => setCompletedQuantity(item.uniqueName, requirement, value)}
                      />
                      <Text type={requirement.isDone ? "success" : "secondary"}>
                        {t("remaining")}: {requirement.remainingQuantity}
                      </Text>
                    </Space>,
                  ]}
                >
                  <Space direction="vertical" style={{ width: "100%" }} size={4}>
                    <Space>
                      <img
                        src={requirement.imageUrl || FALLBACK_ICON}
                        alt={requirement.name}
                        className="item-thumb"
                      />
                      <Text delete={requirement.isDone}>{tin(requirement.uniqueName, requirement.name)}</Text>
                      {requirement.isDone ? <Tag color="success">{t("completed")}</Tag> : null}
                    </Space>
                    <Progress
                      percent={requirement.completionPercent}
                      size="small"
                      status={requirement.isDone ? "success" : "active"}
                      format={() => `${requirement.completedQuantity} / ${requirement.quantity}`}
                    />
                  </Space>
                </List.Item>
              );
            }}
          />
        ),
    };
  });

  return (
    <Card
      title={
        <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
          <span>{`${t("selected")} - ${t("selectedCount", { count: selectedItems.length })}`}</span>
          <Space size={6}>
            <Segmented
              size="small"
              value={completionView}
              onChange={(value) => setCompletionView(value)}
              options={[
                { label: t("completionAll"), value: "all" },
                { label: t("completionOpen"), value: "open" },
                { label: t("completionDone"), value: "done" },
              ]}
            />
          </Space>
        </Flex>
      }
      className="panel-card"
    >
      <Flex vertical gap={8} className="panel-content">
        {/* Search — full width */}
        <Input
          placeholder={t("selectedSearchPlaceholder")}
          value={selectedSearch}
          onChange={(e) => setSelectedSearch(e.target.value)}
          suffix={<SearchOutlined />}
          allowClear
        />

        {/* Category tabs — full width, inline style */}
        {selectedCategoryOptions.length > 2 && (
          <div className="category-tabs">
            {selectedCategoryOptions.map((opt) => (
              <button
                key={opt.value}
                className={`category-tab ${selectedCategoryFilter === opt.value ? "active" : ""}`}
                onClick={() => setSelectedCategoryFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Action bar */}
        <Flex align="center" justify="space-between" gap={8}>
          <Space size={4}>
            {selectedItems.length > 0 && (
              <Tooltip title={t("confirmClearAllContent")}>
                <Button
                  size="small"
                  type="text"
                  icon={<ClearOutlined />}
                  onClick={confirmClearAll}
                  className="clear-all-btn"
                >
                  {t("clearAll")}
                </Button>
              </Tooltip>
            )}
          </Space>
          <Space size={4}>
            <Tooltip title={t("exportData")}>
              <Button
                size="small"
                type="text"
                icon={<DownloadOutlined />}
                onClick={exportData}
                disabled={selectedItems.length === 0}
                className="clear-all-btn"
              />
            </Tooltip>
            <Tooltip title={t("importData")}>
              <Button
                size="small"
                type="text"
                icon={<UploadOutlined />}
                onClick={() => importInputRef.current?.click()}
                className="clear-all-btn"
              />
            </Tooltip>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={importData}
            />
          </Space>

          {focusedTotalRequirement && (
            <Flex align="center" gap={6} style={{ flex: 1 }}>
              <Tag color="gold" closable onClose={() => setFocusedTotalRequirement(null)}>
                {focusedTotalRequirement.name}
              </Tag>
            </Flex>
          )}
        </Flex>

        {focusRequirementKeyValue && (
          <Text type="secondary" style={{ fontSize: 12 }}>{t("focusHint")}</Text>
        )}

        <div className="panel-scroll">
          {selectedItems.length === 0 ? (
            <EmptyState type="add" description={t("noSelected")} />
          ) : filteredSelectedItems.length === 0 ? (
            <EmptyState type="search" description={t("selectedSearchNoResult")} />
          ) : (
            <Collapse
              className="panel-list"
              activeKey={activeKeys}
              onChange={(keys) => {
                const keyList = Array.isArray(keys) ? keys : [keys];
                setActiveKeys(keyList);
                if (keyList.length > 0) {
                  setActiveSelected(keyList[keyList.length - 1]);
                }
              }}
              items={collapseItems}
            />
          )}
        </div>
      </Flex>
    </Card>
  );
}
