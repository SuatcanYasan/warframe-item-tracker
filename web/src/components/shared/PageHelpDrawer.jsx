import { useState } from "react";
import { Drawer, Button, Typography, Divider } from "antd";
import { QuestionCircleOutlined, BulbOutlined, RocketOutlined, KeyOutlined } from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import { useTranslate } from "../../hooks/useTranslate";

const { Title, Text } = Typography;

// Page-keyed help content. Each entry surfaces 3 lists:
//   tips     — what users tend to miss
//   actions  — buttons / shortcuts on this page
//   shortcuts — keyboard helpers
// Lookup is by route path (matches the leading segment).
const PAGE_HELP = {
  "/craft": {
    titleKey: "helpCraftTitle",
    tipsKey: "helpCraftTips",
    actionsKey: "helpCraftActions",
    shortcutsKey: "helpCraftShortcuts",
  },
  "/relic": {
    titleKey: "helpRelicTitle",
    tipsKey: "helpRelicTips",
    actionsKey: "helpRelicActions",
    shortcutsKey: "helpRelicShortcuts",
  },
  "/inventory": {
    titleKey: "helpInventoryTitle",
    tipsKey: "helpInventoryTips",
    actionsKey: "helpInventoryActions",
    shortcutsKey: "helpInventoryShortcuts",
  },
  "/mastery": {
    titleKey: "helpMasteryTitle",
    tipsKey: "helpMasteryTips",
    actionsKey: "helpMasteryActions",
    shortcutsKey: "helpMasteryShortcuts",
  },
  "/timers": {
    titleKey: "helpTimersTitle",
    tipsKey: "helpTimersTips",
    actionsKey: "helpTimersActions",
    shortcutsKey: "helpTimersShortcuts",
  },
  "/amps": {
    titleKey: "helpAmpsTitle",
    tipsKey: "helpAmpsTips",
    actionsKey: "helpAmpsActions",
    shortcutsKey: "helpAmpsShortcuts",
  },
  "/activities": {
    titleKey: "helpActivitiesTitle",
    tipsKey: "helpActivitiesTips",
    actionsKey: "helpActivitiesActions",
    shortcutsKey: "helpActivitiesShortcuts",
  },
  "/checklist": {
    titleKey: "helpChecklistTitle",
    tipsKey: "helpChecklistTips",
    actionsKey: "helpChecklistActions",
    shortcutsKey: "helpChecklistShortcuts",
  },
  "/farm": {
    titleKey: "helpFarmTitle",
    tipsKey: "helpFarmTips",
    actionsKey: "helpFarmActions",
    shortcutsKey: "helpFarmShortcuts",
  },
};

function bulletList(text) {
  if (!text) return null;
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function PageHelpDrawer() {
  const { t } = useTranslate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Match the route path (use first segment so /craft/x still matches /craft)
  const pathKey = "/" + (location.pathname.split("/")[1] || "");
  const meta = PAGE_HELP[pathKey] || PAGE_HELP["/craft"];
  const helpTitle = t(meta.titleKey);
  const tips = bulletList(t(meta.tipsKey));
  const actions = bulletList(t(meta.actionsKey));
  const shortcuts = bulletList(t(meta.shortcutsKey));

  return (
    <>
      <Button
        type="text"
        size="small"
        icon={<QuestionCircleOutlined />}
        aria-label={t("pageHelpOpen")}
        title={t("pageHelpOpen")}
        onClick={() => setOpen(true)}
        className="page-help-trigger"
      />
      <Drawer
        title={helpTitle}
        open={open}
        onClose={() => setOpen(false)}
        width={420}
        classNames={{ body: "page-help-body" }}
      >
        {tips && tips.length > 0 && (
          <section className="page-help-section">
            <Title level={5} className="page-help-section-title">
              <BulbOutlined /> {t("pageHelpTips")}
            </Title>
            <ul>{tips.map((line, i) => <li key={i}>{line}</li>)}</ul>
          </section>
        )}
        {actions && actions.length > 0 && (
          <>
            <Divider />
            <section className="page-help-section">
              <Title level={5} className="page-help-section-title">
                <RocketOutlined /> {t("pageHelpActions")}
              </Title>
              <ul>{actions.map((line, i) => <li key={i}>{line}</li>)}</ul>
            </section>
          </>
        )}
        {shortcuts && shortcuts.length > 0 && (
          <>
            <Divider />
            <section className="page-help-section">
              <Title level={5} className="page-help-section-title">
                <KeyOutlined /> {t("pageHelpShortcuts")}
              </Title>
              <ul>{shortcuts.map((line, i) => <li key={i}>{line}</li>)}</ul>
            </section>
          </>
        )}
        <Text type="secondary" className="page-help-footnote">
          {t("pageHelpFootnote")}
        </Text>
      </Drawer>
    </>
  );
}
