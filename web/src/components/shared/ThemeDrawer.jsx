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
} from "antd";
import toast from "react-hot-toast";
import { themeOptions, colorFields } from "../../constants/themes";
import { useTranslate } from "../../hooks/useTranslate";
import { useAppStore } from "../../stores/appStore";

const { Text } = Typography;

export default function ThemeDrawer() {
  const { t } = useTranslate();
  const open = useAppStore((s) => s.themeDrawerOpen);
  const onClose = useAppStore((s) => s.closeThemeDrawer);
  const themeName = useAppStore((s) => s.themeName);
  const setThemeName = useAppStore((s) => s.setThemeName);
  const customThemeTokens = useAppStore((s) => s.customThemeTokens);
  const setCustomThemeTokens = useAppStore((s) => s.setCustomThemeTokens);
  const themeProfiles = useAppStore((s) => s.themeProfiles);
  const setThemeProfiles = useAppStore((s) => s.setThemeProfiles);
  const selectedProfileName = useAppStore((s) => s.selectedProfileName);
  const setSelectedProfileName = useAppStore((s) => s.setSelectedProfileName);
  const themeProfileInput = useAppStore((s) => s.themeProfileInput);
  const setThemeProfileInput = useAppStore((s) => s.setThemeProfileInput);
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
      toast(t("themeProfileRequired"));
      return;
    }
    setThemeProfiles((prev) => ({
      ...prev,
      [trimmedName]: { themeName, token: customThemeTokens },
    }));
    setSelectedProfileName(trimmedName);
    setThemeProfileInput("");
    toast.success(t("themeSaved"));
  }

  function loadThemeProfile(profileName) {
    const profile = themeProfiles[profileName];
    if (!profile) return;
    setThemeName(profile.themeName);
    setCustomThemeTokens(profile.token);
    setSelectedProfileName(profileName);
    toast.success(t("themeLoaded"));
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
        toast.success(t("themeLoaded"));
      } catch {
        toast.error(t("invalidThemeFile"));
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <Drawer
      rootClassName="theme-drawer"
      title={t("customize")}
      placement="right"
      width={360}
      open={open}
      onClose={onClose}
      extra={<Button onClick={resetThemeToPreset}>{t("resetTheme")}</Button>}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Text strong>{t("themeSelectLabel")}</Text>
        <Flex gap={8} align="center">
          <Select
            style={{ flex: 1 }}
            // Value: either a built-in theme name ("orokin"/"drifter"/"lotus")
            // or a user-saved profile key (stored in themeProfiles). The saved
            // profile takes priority when selected via loadThemeProfile.
            value={selectedProfileName || themeName}
            options={[
              {
                label: t("themeBuiltIn"),
                options: Object.entries(themeOptions).map(([value, opt]) => ({
                  value,
                  label: opt.label,
                })),
              },
              ...(Object.keys(themeProfiles).length > 0 ? [{
                label: t("themeSavedProfiles"),
                options: Object.keys(themeProfiles).map((name) => ({
                  label: name,
                  value: `profile:${name}`,
                })),
              }] : []),
            ]}
            onChange={(value) => {
              if (value.startsWith("profile:")) {
                const name = value.slice("profile:".length);
                setSelectedProfileName(name);
                loadThemeProfile(name);
              } else {
                setSelectedProfileName("");
                setThemeName(value);
                setCustomThemeTokens(themeOptions[value].token);
              }
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
          <Button type="primary" onClick={saveCurrentThemeProfile} style={{ whiteSpace: "nowrap" }}>
            {t("save")}
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
          <Flex key={tokenKey} className="theme-color-row" align="center" justify="space-between">
            <Text>{t(labelKey)}</Text>
            <ColorPicker
              value={customThemeTokens[tokenKey]}
              onChange={(value) => updateThemeToken(tokenKey, value.toHexString())}
              showText
            />
          </Flex>
        ))}

        <Divider />
        <Flex className="theme-color-row" align="center" justify="space-between" gap={8}>
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
