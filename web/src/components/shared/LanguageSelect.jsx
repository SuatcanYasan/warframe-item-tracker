import { Select } from "antd";
import { SUPPORTED_LANGUAGES, flagUrl } from "../../constants/languages";

function LanguageOption({ language, showLabel = true }) {
  return (
    <span className="lang-select-option">
      <img
        src={flagUrl(language.flag)}
        alt=""
        className="lang-select-flag"
        loading="lazy"
      />
      {showLabel && <span className="lang-select-label">{language.label}</span>}
    </span>
  );
}

export default function LanguageSelect({ value, onChange, compact = false, ...rest }) {
  const options = SUPPORTED_LANGUAGES.map((l) => ({
    value: l.code,
    label: <LanguageOption language={l} />,
  }));

  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      className={`lang-select ${compact ? "lang-select-compact" : ""}`}
      popupMatchSelectWidth={160}
      size={compact ? "small" : "middle"}
      {...rest}
    />
  );
}
