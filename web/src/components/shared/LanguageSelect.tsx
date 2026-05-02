import { Select } from "antd";
import { SUPPORTED_LANGUAGES, flagUrl, type LanguageOption } from "../../constants/languages";

interface LanguageOptionProps {
  language: LanguageOption;
  showLabel?: boolean;
}

function LanguageOptionView({ language, showLabel = true }: LanguageOptionProps) {
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

interface Props {
  value?: string;
  onChange?: (value: string) => void;
  compact?: boolean;
  [key: string]: unknown;
}

export default function LanguageSelect({ value, onChange, compact = false, ...rest }: Props) {
  const options = SUPPORTED_LANGUAGES.map((l) => ({
    value: l.code,
    label: <LanguageOptionView language={l} />,
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
