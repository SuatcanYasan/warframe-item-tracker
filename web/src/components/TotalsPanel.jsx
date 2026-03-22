import { memo, useState } from "react";
import {
  App,
  Badge,
  Button,
  Card,
  Flex,
  InputNumber,
  List,
  Progress,
  Space,
  Spin,
  Tooltip,
  Typography,
} from "antd";
import { SendOutlined } from "@ant-design/icons";
import { FALLBACK_ICON } from "../utils/helpers";
import DropInfoPopover from "./DropInfoPopover";

const { Text } = Typography;

export default memo(function TotalsPanel({
  t,
  tin,
  adjustedTotals,
  loadingCalc,
  focusedTotalRequirement,
  setFocusedTotalRequirement,
  requirementParentMap,
  onBulkDonate,
}) {
  const { message } = App.useApp();
  const [donateAmounts, setDonateAmounts] = useState({});
  const [flashKey, setFlashKey] = useState(null);

  function handleBulkDonate(resource) {
    const amount = donateAmounts[resource.uniqueName];
    if (!amount || amount <= 0) return;
    onBulkDonate(resource.uniqueName, amount);
    setDonateAmounts((prev) => ({ ...prev, [resource.uniqueName]: null }));
    setFlashKey(resource.uniqueName);
    setTimeout(() => setFlashKey(null), 1500);
    message.success(t("bulkDonateSuccess", { name: resource.name, amount }));
  }

  function quickFill(resource, fraction) {
    const val = fraction === 1 ? resource.remaining : Math.ceil(resource.remaining * fraction);
    setDonateAmounts((prev) => ({ ...prev, [resource.uniqueName]: val }));
  }

  return (
    <Card
      title={`${t("totals")} - ${t("totalCount", { count: adjustedTotals.length })}`}
      className="panel-card"
    >
      <Flex vertical className="panel-content" gap={0} style={{ height: "100%" }}>
        {/* Top: Resource totals list */}
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          <div className="panel-scroll" style={{ height: "100%" }}>
            <Spin spinning={loadingCalc}>
              <List
                className="panel-list"
                dataSource={adjustedTotals}
                locale={{ emptyText: t("statusReady") }}
                renderItem={(resource) => (
                  <Tooltip
                    title={t("requirementUsedByCount", {
                      count: requirementParentMap.get(resource.uniqueName)?.size || 0,
                    })}
                    placement="left"
                    mouseEnterDelay={0.5}
                  >
                    <List.Item
                      className={`total-row ${
                        focusedTotalRequirement?.uniqueName === resource.uniqueName ? "focused-total-row" : ""
                      } ${flashKey === resource.uniqueName ? "donate-flash" : ""}`}
                      onClick={() => {
                        const current = focusedTotalRequirement?.uniqueName;
                        const next =
                          current === resource.uniqueName
                            ? null
                            : { uniqueName: resource.uniqueName, name: resource.name };
                        setFocusedTotalRequirement(next);
                        if (next && !(requirementParentMap.get(resource.uniqueName)?.size > 0)) {
                          message.info(t("requirementUsedByNone"));
                        }
                      }}
                    >
                      <Flex align="center" gap={10} style={{ flex: 1, minWidth: 0 }}>
                        <img
                          src={resource.imageUrl || FALLBACK_ICON}
                          alt={resource.name}
                          className="item-thumb"
                        />
                        <Flex vertical style={{ flex: 1, minWidth: 0 }}>
                          <Flex justify="space-between" align="center" gap={4}>
                            <Flex align="center" gap={4} style={{ minWidth: 0 }}>
                              <Text ellipsis style={{ fontWeight: 500 }}>{tin(resource.uniqueName, resource.name)}</Text>
                              <DropInfoPopover uniqueName={resource.uniqueName} itemName={tin(resource.uniqueName, resource.name)} t={t} />
                            </Flex>
                            {resource.status === "done" ? (
                              <Badge status="success" text={t("completeTag")} />
                            ) : (
                              <Text
                                strong
                                style={{ fontFamily: "var(--font-mono)", fontSize: 13, whiteSpace: "nowrap" }}
                              >
                                {resource.remaining}
                              </Text>
                            )}
                          </Flex>
                          <Progress
                            percent={resource.completionPercent}
                            size="small"
                            status={resource.status === "done" ? "success" : "active"}
                            style={{ margin: 0 }}
                          />
                          {/* Inline bulk donate */}
                          {resource.remaining > 0 && (
                            <Flex
                              vertical
                              gap={4}
                              style={{ marginTop: 6 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Space size={2}>
                                {[0.25, 0.5, 1].map((frac) => (
                                  <Button
                                    key={frac}
                                    size="small"
                                    type="text"
                                    className="quick-fill-btn"
                                    onClick={() => quickFill(resource, frac)}
                                  >
                                    {frac === 1 ? "Max" : `${frac * 100}%`}
                                  </Button>
                                ))}
                              </Space>
                              <Flex gap={4} align="center">
                                <InputNumber
                                  min={1}
                                  max={resource.remaining}
                                  size="small"
                                  placeholder={t("bulkDonatePlaceholder")}
                                  value={donateAmounts[resource.uniqueName] || null}
                                  onChange={(val) =>
                                    setDonateAmounts((prev) => ({ ...prev, [resource.uniqueName]: val }))
                                  }
                                  onPressEnter={() => handleBulkDonate(resource)}
                                  style={{ flex: 1, minWidth: 0 }}
                                />
                                <Tooltip title={t("bulkDonateHint")}>
                                  <Button
                                    size="small"
                                    type="primary"
                                    icon={<SendOutlined />}
                                    disabled={!donateAmounts[resource.uniqueName]}
                                    onClick={() => handleBulkDonate(resource)}
                                  />
                                </Tooltip>
                              </Flex>
                            </Flex>
                          )}
                        </Flex>
                      </Flex>
                    </List.Item>
                  </Tooltip>
                )}
              />
            </Spin>
          </div>
        </div>
      </Flex>
    </Card>
  );
})
