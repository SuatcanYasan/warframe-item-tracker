import { App, Flex, Modal, Segmented, Space, Typography } from "antd";
import { themeOptions } from "../../constants/themes";
import { useTranslate } from "../../hooks/useTranslate";
import { useAppStore } from "../../stores/appStore";

const { Text } = Typography;

export default function WizardModal() {
  const { message } = App.useApp();
  const { t } = useTranslate();
  const open = useAppStore((s) => s.wizardOpen);
  const closeWizard = useAppStore((s) => s.closeWizard);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const themeName = useAppStore((s) => s.themeName);
  const setThemeName = useAppStore((s) => s.setThemeName);
  const setCustomThemeTokens = useAppStore((s) => s.setCustomThemeTokens);

  function handleFinish() {
    closeWizard();
    message.success(t("wizardFinish"));
  }

  return (
    <Modal
      title={t("wizardTitle")}
      open={open}
      onCancel={handleFinish}
      onOk={handleFinish}
      okText={t("wizardFinish")}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Text>{t("wizardBody")}</Text>
        <Flex align="center" justify="space-between" wrap="wrap" gap={10}>
          <Text>{t("language")}</Text>
          <Segmented
            value={language}
            onChange={(value) => setLanguage(value)}
            options={[
              { value: "tr", label: "TR" },
              { value: "en", label: "EN" },
            ]}
          />
        </Flex>
        <Flex align="center" justify="space-between" wrap="wrap" gap={10}>
          <Text>{t("theme")}</Text>
          <Segmented
            value={themeName}
            onChange={(value) => {
              setThemeName(value);
              setCustomThemeTokens(themeOptions[value].token);
            }}
            options={Object.entries(themeOptions).map(([value, option]) => ({
              value,
              label: option.label,
            }))}
          />
        </Flex>
      </Space>
    </Modal>
  );
}
