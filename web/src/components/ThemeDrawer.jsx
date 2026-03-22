import { useRef } from "react";
import {
  Button,
  ColorPicker,
  Divider,
  Drawer,
  Flex,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
  message,
} from "antd";
import { themeOptions, colorFields } from "../constants/themes";

const { Text } = Typography;

export default function ThemeDrawer({
  t,
  open,
  onClose,
  themeName,
  setThemeName,
  customThemeTokens,
  setCustomThemeTokens,
  themeProfiles,
  setThemeProfiles,
  selectedProfileName,
  setSelectedProfileName,
  themeProfileInput,
  setThemeProfileInput,
}) {
  const importInputRef = useRef(null);

  function updateThemeToken(key, value) {
    setCustomThemeTokens((prev) => ({ ...prev, [key]: value }));
  }

  function resetThemeToPreset() {
    setCustomThemeTokens(themeOptions[themeName].token);
  }

  function saveCurrentThemeProfile() {
    const trimmedName = themeProfileInput.trim();
    if (!trimmedName) {
      message.warning(t("themeProfileRequired"));
      return;
    }
    setThemeProfiles((prev) => ({
      ...prev,
      [trimmedName]: { themeName, token: customThemeTokens },
    }));
    setSelectedProfileName(trimmedName);
    setThemeProfileInput("");
    message.success(t("themeSaved"));
  }

  function loadThemeProfile(profileName) {
    const profile = themeProfiles[profileName];
    if (!profile) return;
    setThemeName(profile.themeName);
    setCustomThemeTokens(profile.token);
    setSelectedProfileName(profileName);
    message.success(t("themeLoaded"));
  }

  function removeThemeProfile(profileName) {
    setThemeProfiles((prev) => {
      const next = { ...prev };
      delete next[profileName];
      return next;
    });
    if (selectedProfileName === profileName) {
      setSelectedProfileName("");
    }
  }

  function exportCurrentTheme() {
    const blob = new Blob([JSON.stringify({ themeName, token: customThemeTokens }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wf-theme-${themeName}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importThemeFromFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        if (!parsed?.token) throw new Error("invalid");
        if (themeOptions[parsed.themeName]) {
          setThemeName(parsed.themeName);
        }
        setCustomThemeTokens(parsed.token);
        message.success(t("themeLoaded"));
      } catch {
        message.error(t("invalidThemeFile"));
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <Drawer
      title={t("customize")}
      placement="right"
      width={360}
      open={open}
      onClose={onClose}
      extra={<Button onClick={resetThemeToPreset}>{t("resetTheme")}</Button>}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Text strong>{t("loadThemeProfile")}</Text>
        <Flex gap={8} align="center">
          <Select
            style={{ flex: 1 }}
            value={selectedProfileName || undefined}
            placeholder={t("themeProfileEmpty")}
            options={Object.keys(themeProfiles).map((name) => ({ label: name, value: name }))}
            onChange={(value) => {
              setSelectedProfileName(value);
              loadThemeProfile(value);
            }}
          />
          <Button
            danger
            disabled={!selectedProfileName}
            onClick={() => removeThemeProfile(selectedProfileName)}
          >
            {t("remove")}
          </Button>
        </Flex>

        <Text strong>{t("saveThemeProfile")}</Text>
        <Flex gap={8} align="center">
          <Input
            value={themeProfileInput}
            placeholder={t("themeProfilePlaceholder")}
            onChange={(e) => setThemeProfileInput(e.target.value)}
          />
          <Button type="primary" onClick={saveCurrentThemeProfile}>
            {t("saveThemeProfile")}
          </Button>
        </Flex>

        <Space>
          <Button onClick={exportCurrentTheme}>{t("exportTheme")}</Button>
          <Button onClick={() => importInputRef.current?.click()}>{t("importTheme")}</Button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={importThemeFromFile}
          />
        </Space>

        <Divider />

        {colorFields.map(([tokenKey, labelKey]) => (
          <Flex key={tokenKey} align="center" justify="space-between">
            <Text>{t(labelKey)}</Text>
            <ColorPicker
              value={customThemeTokens[tokenKey]}
              onChange={(value) => updateThemeToken(tokenKey, value.toHexString())}
              showText
            />
          </Flex>
        ))}

        <Divider />
        <Flex align="center" justify="space-between" gap={8}>
          <Text>{t("customRadius")}</Text>
          <InputNumber
            min={2}
            max={24}
            value={customThemeTokens.borderRadius}
            onChange={(value) => updateThemeToken("borderRadius", Math.max(2, Number(value) || 2))}
          />
        </Flex>
      </Space>
    </Drawer>
  );
}
