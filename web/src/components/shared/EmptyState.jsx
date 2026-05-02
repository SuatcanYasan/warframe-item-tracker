import { Button, Typography } from "antd";
import {
  SearchOutlined,
  PlusCircleOutlined,
  CheckCircleOutlined,
  InboxOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  AppstoreAddOutlined,
  ExperimentOutlined,
  CompassOutlined,
  CloudSyncOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const ICONS = {
  search: <SearchOutlined />,
  add: <PlusCircleOutlined />,
  done: <CheckCircleOutlined />,
  inventory: <InboxOutlined />,
  mastery: <TrophyOutlined />,
  checklist: <ThunderboltOutlined />,
  craft: <AppstoreAddOutlined />,
  amp: <ExperimentOutlined />,
  farm: <CompassOutlined />,
  sync: <CloudSyncOutlined />,
};

// Friendly empty placeholder. Use across pages so the user always knows
// what to do next when a list/grid is empty.
//
// Props:
//   icon         — key from ICONS map (default: "search")
//   title        — bold headline (1 short line)
//   description  — supporting line (under 80 chars)
//   ctaLabel     — primary action button text
//   ctaIcon      — optional icon for the CTA
//   onCta        — primary action handler
//   secondaryLabel / onSecondary — optional secondary action (text button)
//   compact      — smaller padding (for tab-internal usage)
export default function EmptyState({
  icon = "search",
  title,
  description,
  ctaLabel,
  ctaIcon,
  onCta,
  secondaryLabel,
  onSecondary,
  compact = false,
}) {
  const IconElement = ICONS[icon] || ICONS.search;

  return (
    <div className={`empty-state ${compact ? "empty-state-compact" : ""}`}>
      <div className="empty-state-icon">{IconElement}</div>
      {title && <Text className="empty-state-title">{title}</Text>}
      {description && <Text className="empty-state-desc">{description}</Text>}
      {(ctaLabel || secondaryLabel) && (
        <div className="empty-state-actions">
          {ctaLabel && (
            <Button
              type="primary"
              icon={ctaIcon || <PlusCircleOutlined />}
              size="middle"
              onClick={onCta}
            >
              {ctaLabel}
            </Button>
          )}
          {secondaryLabel && (
            <Button type="text" size="middle" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
