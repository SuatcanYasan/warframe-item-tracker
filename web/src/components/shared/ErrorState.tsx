import type { ReactNode } from "react";
import { Button, Typography } from "antd";
import { DisconnectOutlined, ReloadOutlined, WarningOutlined } from "@ant-design/icons";
import { useTranslate } from "../../hooks/useTranslate";

const { Text } = Typography;

interface Props {
  variant?: "network" | "server";
  title?: ReactNode;
  description?: ReactNode;
  onRetry?: () => void;
  compact?: boolean;
}

// Inline error pattern with retry. Used when a query fails.
export default function ErrorState({
  variant = "network",
  title,
  description,
  onRetry,
  compact = false,
}: Props) {
  const { t } = useTranslate();
  const Icon = variant === "server" ? WarningOutlined : DisconnectOutlined;
  const fallbackTitle = variant === "server" ? t("errorServerTitle") : t("errorNetworkTitle");
  const fallbackDesc = variant === "server" ? t("errorServerDesc") : t("errorNetworkDesc");
  return (
    <div className={`error-state ${compact ? "error-state-compact" : ""}`}>
      <div className="error-state-icon"><Icon /></div>
      <Text className="error-state-title">{title || fallbackTitle}</Text>
      <Text className="error-state-desc">{description || fallbackDesc}</Text>
      {onRetry && (
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={onRetry}
          size="middle"
          style={{ marginTop: 8 }}
        >
          {t("errorRetry")}
        </Button>
      )}
    </div>
  );
}
