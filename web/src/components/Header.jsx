import { memo } from "react";
import { Button, Card, Divider, Flex, Segmented, Space, Tag, Typography } from "antd";
import { GlobalOutlined, SkinOutlined } from "@ant-design/icons";
import { themeOptions } from "../constants/themes";
import ProgressOverview from "./ProgressOverview";

const { Title, Text } = Typography;

export default memo(function Header({
  t,
  language,
  setLanguage,
  themeName,
  setThemeName,
  setCustomThemeTokens,
  setThemeDrawerOpen,
  setWizardOpen,
  showShortcuts,
  adjustedTotals,
  selectedItems,
}) {
  return (
    <Card className="hero-card" variant="borderless">
      <Flex vertical gap={12}>
        <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
          <Flex align="center" gap={12}>
            <img src="/logo.svg" alt="WCT Logo" style={{ width: 44, height: 44 }} />
            <div>
              <Title level={3} style={{ margin: 0 }}>
                Warframe Craft Tracker
              </Title>
              <Text type="secondary">{t("subtitle")}</Text>
            </div>
          </Flex>

          <Space wrap>
            <Tag icon={<GlobalOutlined />}>{t("language")}</Tag>
            <Segmented
              value={language}
              onChange={(value) => setLanguage(value)}
              options={[
                { value: "tr", label: "TR" },
                { value: "en", label: "EN" },
              ]}
            />

            <Tag icon={<SkinOutlined />}>{t("theme")}</Tag>
            <Segmented
              value={themeName}
              onChange={(value) => {
                setThemeName(value);
                setCustomThemeTokens(themeOptions[value].token);
              }}
              options={Object.entries(themeOptions).map(([value, opt]) => ({
                value,
                label: opt.label,
              }))}
            />

            <Divider type="vertical" />

            <Button onClick={() => setThemeDrawerOpen(true)}>{t("customize")}</Button>
            <Button onClick={() => setWizardOpen(true)}>{t("wizardOpen")}</Button>
            <Button onClick={showShortcuts}>{t("shortcuts")}</Button>
          </Space>
        </Flex>

        <ProgressOverview t={t} adjustedTotals={adjustedTotals} selectedItems={selectedItems} />
      </Flex>
    </Card>
  );
})
