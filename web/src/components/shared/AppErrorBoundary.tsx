import type { ReactNode } from "react";
import { Button, Typography } from "antd";
import { ReloadOutlined, WarningOutlined } from "@ant-design/icons";
import { Sentry } from "../../lib/sentry";
import { useTranslate } from "../../hooks/useTranslate";

const { Text, Title } = Typography;

interface FallbackProps {
  resetError?: () => void;
}

function FallbackUI({ resetError }: FallbackProps) {
  const { t } = useTranslate();
  return (
    <div
      role="alert"
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 32,
        gap: 12,
      }}
    >
      <WarningOutlined style={{ fontSize: 40, color: "var(--wf-primary, #CA8A04)" }} />
      <Title level={3} style={{ marginBottom: 0 }}>
        {t("errorBoundaryTitle")}
      </Title>
      <Text type="secondary" style={{ maxWidth: 480 }}>
        {t("errorBoundaryDesc")}
      </Text>
      <Button
        type="primary"
        icon={<ReloadOutlined />}
        onClick={() => {
          // Clear the React error and force a clean reload so cached state
          // (zustand stores, query cache) doesn't immediately re-throw.
          try { resetError?.(); } catch { /* ignore */ }
          if (typeof window !== "undefined") window.location.reload();
        }}
        style={{ marginTop: 8 }}
      >
        {t("errorBoundaryReload")}
      </Button>
    </div>
  );
}

interface Props {
  children?: ReactNode;
}

// Wraps the app in a Sentry ErrorBoundary so uncaught render errors get
// reported (when DSN is set) and replaced with a friendly fallback.
export default function AppErrorBoundary({ children }: Props) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => <FallbackUI resetError={resetError} />}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
