import { App, Flex, Modal, Segmented, Space, Typography } from "antd";
import { themeOptions } from "../constants/themes";

const { Text } = Typography;

export default function WizardModal({
  t,
  open,
  language,
  setLanguage,
  themeName,
  setThemeName,
  setCustomThemeTokens,
  onFinish,
}) {
  const { message } = App.useApp();

  function handleFinish() {
    onFinish();
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
