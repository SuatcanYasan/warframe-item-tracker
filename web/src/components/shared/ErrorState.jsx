import { Button, Typography } from "antd";
import { DisconnectOutlined, ReloadOutlined, WarningOutlined } from "@ant-design/icons";
import { useTranslate } from "../../hooks/useTranslate";

const { Text } = Typography;

// Inline error pattern with retry. Used when a query fails.
// Props:
//   variant      "network" (default) | "server" — picks icon
//   title        custom headline (i18n-translated already, or null for default)
//   description  custom description
//   onRetry      retry handler — shows primary "Retry" button
//   compact      smaller padding (for in-card usage)
export default function ErrorState({
  variant = "network",
  title,
  description,
  onRetry,
  compact = false,
}) {
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
