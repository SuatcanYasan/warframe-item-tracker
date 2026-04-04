import { useLocation } from "react-router-dom";
import { Segmented } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { themeOptions } from "../constants/themes";

export default function AppHeader({ t, language, setLanguage, themeName, setThemeName, setCustomThemeTokens, onOpenSettings }) {
  const location = useLocation();
  const isRelic = location.pathname === "/relic";
  const pageTitle = isRelic ? t("relicTracker") : t("craftTracker");
  const pageDesc = isRelic ? t("relicTrackerDesc") : t("craftTrackerDesc");

  return (
    <header className="app-header">
      <div className="app-header-left">
        <span className="app-header-title">{pageTitle}</span>
        <span className="app-header-desc">{pageDesc}</span>
      </div>
      <div className="app-header-right">
        <Segmented
          size="small"
          value={language}
          onChange={setLanguage}
          options={[{ value: "tr", label: "TR" }, { value: "en", label: "EN" }]}
        />
        <Segmented
          size="small"
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
        <button className="header-icon-btn" onClick={onOpenSettings}>
          <SettingOutlined />
        </button>
      </div>
    </header>
  );
}
