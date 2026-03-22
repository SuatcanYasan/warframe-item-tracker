import { memo } from "react";
import { Flex, Progress, Space, Typography } from "antd";

const { Text } = Typography;

export default memo(function ProgressOverview({ t, adjustedTotals, selectedItems }) {
  if (selectedItems.length === 0) return null;

  const totalMaterials = adjustedTotals.length;
  const doneMaterials = adjustedTotals.filter((r) => r.status === "done").length;
  const overallPercent =
    totalMaterials > 0 ? Math.round((doneMaterials / totalMaterials) * 100) : 0;

  return (
    <Flex align="center" gap={16} wrap="wrap" className="progress-overview">
      <Progress
        type="circle"
        percent={overallPercent}
        size={48}
        strokeWidth={8}
        strokeColor={{ '0%': '#3b6fd4', '100%': '#c8a84e' }}
        format={(p) => `${p}%`}
      />
      <Space direction="vertical" size={0}>
        <Text strong>{t("progressOverview")}</Text>
        <Text type="secondary">
          {t("trackingItems", { count: selectedItems.length })}
          {" · "}
          {t("materialsComplete", { done: doneMaterials, total: totalMaterials })}
        </Text>
      </Space>
    </Flex>
  );
})
